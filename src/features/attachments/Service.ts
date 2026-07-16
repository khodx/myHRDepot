// The upload path is wired through a named Supabase Edge Function that handles Google Drive
// service-account access. This service orchestrates: validate file -> invoke Drive upload function
// -> persist returned metadata via mhd_create_attachment.

import { appConfig } from '@/config/appConfig';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAttachment,
  MhdAttachmentEntityType,
  MhdCreateAttachmentInput,
  MhdDriveUploadResponse,
  MhdAttachmentUploadResult,
} from './Types';
import { mhdValidateAttachment, mhdGetFileExtension } from './Types';

// Row shape of mhd_list_attachments_for_entity per the generated database.types.ts —
// Google Drive metadata columns only (no storage_path/file_name).
type MhdAttachmentRow = {
  id: string;
  reference_id: string;
  entity_type: string;
  entity_id: string;
  storage_provider: string;
  drive_file_id: string;
  drive_folder_id: string;
  drive_web_view_link: string | null;
  drive_web_content_link: string | null;
  original_file_name: string;
  stored_file_name: string | null;
  mime_type: string;
  file_extension: string | null;
  file_size_bytes: number;
  version_number: number | null;
  is_current_version: boolean | null;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  uploader_display_name: string | null;
  can_delete: boolean;
};

type MhdCreateAttachmentResultRow = {
  id: string;
  reference_id: string;
  drive_file_id: string;
  drive_web_view_link: string | null;
};

function mapAttachmentRow(row: MhdAttachmentRow): MhdAttachment {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdAttachment['referenceId'],
    entityType: row.entity_type,
    entityId: row.entity_id,
    storageProvider: row.storage_provider as MhdAttachment['storageProvider'],
    driveFileId: row.drive_file_id,
    driveFolderId: row.drive_folder_id,
    driveWebViewLink: row.drive_web_view_link,
    driveWebContentLink: row.drive_web_content_link,
    originalFileName: row.original_file_name,
    storedFileName: row.stored_file_name,
    mimeType: row.mime_type,
    fileExtension: row.file_extension,
    fileSizeBytes: row.file_size_bytes,
    versionNumber: row.version_number,
    isCurrentVersion: row.is_current_version,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at,
    uploaderDisplayName: row.uploader_display_name,
    canDelete: row.can_delete,
  };
}

async function uploadFileToGoogleDrive(
  file: File,
  entityType: MhdAttachmentEntityType,
  entityId: string,
): Promise<MhdDriveUploadResponse> {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('entity_type', entityType);
  formData.set('entity_id', entityId);
  formData.set('original_file_name', file.name);
  formData.set('mime_type', file.type);

  const { data, error } = await supabaseClient.functions.invoke<MhdDriveUploadResponse>(
    appConfig.attachmentUploadFunctionName,
    { body: formData },
  );

  if (error) {
    throw new Error(error.message || 'Google Drive upload failed.');
  }

  if (!data?.driveFileId || !data?.driveFolderId) {
    throw new Error('Google Drive upload function returned an incomplete payload.');
  }

  return data;
}

export const mhdAttachmentService = {
  async listAttachments(entityType: MhdAttachmentEntityType, entityId: string): Promise<MhdAttachment[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_attachments_for_entity', {
        p_entity_type: entityType,
        p_entity_id: entityId,
      })
      .returns<MhdAttachmentRow[]>();
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAttachmentRow);
  },

  async uploadAttachment(
    entityType: MhdAttachmentEntityType,
    entityId: string,
    file: File,
  ): Promise<MhdAttachmentUploadResult> {
    const validation = mhdValidateAttachment(file);
    if (!validation.valid) throw new Error(validation.error);

    // 1. Upload the file bytes to Google Drive via the edge function.
    const drive = await uploadFileToGoogleDrive(file, entityType, entityId);

    // 2. Record the resulting Drive metadata via mhd_create_attachment.
    const input: MhdCreateAttachmentInput = {
      entityType,
      entityId,
      driveFileId: drive.driveFileId,
      driveFolderId: drive.driveFolderId,
      driveWebViewLink: drive.driveWebViewLink,
      driveWebContentLink: drive.driveWebContentLink,
      originalFileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      fileExtension: mhdGetFileExtension(file.name),
      storedFileName: drive.storedFileName ?? null,
    };

    // The generated RPC signature requires the web link args as strings; the truly optional
    // args (p_file_extension, p_stored_file_name, p_version_number) are omitted when absent
    // rather than passed as null.
    const { data, error } = await supabaseClient
      .rpc('mhd_create_attachment', {
        p_entity_type: input.entityType,
        p_entity_id: input.entityId,
        p_drive_file_id: input.driveFileId,
        p_drive_folder_id: input.driveFolderId,
        p_drive_web_view_link: input.driveWebViewLink ?? '',
        p_drive_web_content_link: input.driveWebContentLink ?? '',
        p_original_file_name: input.originalFileName,
        p_mime_type: input.mimeType,
        p_file_size_bytes: input.fileSizeBytes,
        ...(input.fileExtension ? { p_file_extension: input.fileExtension } : {}),
        ...(input.storedFileName ? { p_stored_file_name: input.storedFileName } : {}),
        ...(input.versionNumber != null ? { p_version_number: input.versionNumber } : {}),
      })
      .returns<MhdCreateAttachmentResultRow[]>();
    if (error) throw new Error(error.message);

    const row = data?.[0];
    if (!row) throw new Error('Unable to record attachment: no record returned.');
    return {
      id: row.id,
      referenceId: row.reference_id as MhdAttachmentUploadResult['referenceId'],
      driveFileId: row.drive_file_id,
      driveWebViewLink: row.drive_web_view_link,
    };
  },

  /** Opens the Drive web view link in a new tab. There is no server-side download proxy --
   *  Google Drive serves the file directly via its own sharing/permission model. */
  downloadAttachment(attachment: MhdAttachment): void {
    if (!attachment.driveWebViewLink) {
      throw new Error('No Drive web view link available for this attachment.');
    }
    window.open(attachment.driveWebViewLink, '_blank', 'noopener,noreferrer');
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    // Soft-deletes the DB record. Drive-object deletion is intentionally decoupled from metadata
    // deletion; mhd_delete_attachment only marks the row deleted.
    const { error } = await supabaseClient.rpc('mhd_delete_attachment', {
      p_attachment_id: attachmentId,
    });
    if (error) throw new Error(error.message);
  },
};
