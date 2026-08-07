// Matches TBL-013's locked, polymorphic (entityType/entityId) Google Drive metadata design.
// Supabase stores Drive metadata only (drive_file_id, drive_folder_id, web links,
// original/stored file names, storage_provider) — no storage_path/file_name columns exist.

export type MhdAttachmentId = string;
export type MhdAttachmentReferenceId = `FILE-${string}`;

/** Extensible: 'TASK' | 'SUBTASK' | 'NOTE' today; new entity types only require extending the
 *  server-side mhd_resolve_attachment_company_id() function, not a schema migration. */
export type MhdAttachmentEntityType = 'TASK' | 'SUBTASK' | 'NOTE' | (string & {});

export type MhdAttachmentStorageProvider = 'GOOGLE_DRIVE';

export interface MhdAttachment {
  id: MhdAttachmentId;
  referenceId: MhdAttachmentReferenceId;
  entityType: MhdAttachmentEntityType;
  entityId: string;
  storageProvider: MhdAttachmentStorageProvider;
  driveFileId: string;
  driveFolderId: string;
  driveWebViewLink: string | null;
  driveWebContentLink: string | null;
  originalFileName: string;
  storedFileName: string | null;
  mimeType: string;
  fileExtension: string | null;
  fileSizeBytes: number;
  versionNumber: number | null;
  isCurrentVersion: boolean | null;
  /** RT-001 rich text editor document describing the uploaded record. */
  descriptionRichText: unknown;
  /** Generated plain-text companion of descriptionRichText, used for search/reporting/audit. */
  descriptionPlainText: string;
  uploadedBy: string;
  uploadedAt: string;
  createdAt: string;
  uploaderDisplayName: string | null;
  canDelete: boolean;
}

/** Input to mhd_create_attachment. The client (or an edge function using Drive service-account
 *  credentials) has ALREADY uploaded the file to Google Drive before calling this -- this SQL
 *  layer only records the resulting Drive metadata; it never calls the Drive API itself. */
export interface MhdCreateAttachmentInput {
  entityType: MhdAttachmentEntityType;
  entityId: string;
  driveFileId: string;
  driveFolderId: string;
  driveWebViewLink?: string | null;
  driveWebContentLink?: string | null;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  descriptionRichText: unknown;
  descriptionPlainText: string;
  fileExtension?: string | null;
  storedFileName?: string | null;
  versionNumber?: number | null;
}

export interface MhdAttachmentUploadResult {
  id: MhdAttachmentId;
  referenceId: MhdAttachmentReferenceId;
  driveFileId: string;
  driveFolderId?: string | null;
  driveWebViewLink: string | null;
}

export interface MhdDriveUploadResponse {
  driveFileId: string;
  driveFolderId: string;
  driveWebViewLink: string | null;
  driveWebContentLink: string | null;
  storedFileName?: string | null;
}

export interface MhdAttachmentValidationResult {
  valid: boolean;
  error?: string;
}

export const MHD_ATTACHMENT_MAX_SIZE_MB = 25;
export const MHD_ATTACHMENT_MAX_SIZE_BYTES = MHD_ATTACHMENT_MAX_SIZE_MB * 1024 * 1024;

export const MHD_ATTACHMENT_ALLOWED_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/json',
];

export function mhdFormatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function mhdGetFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

export function mhdValidateAttachment(file: File): MhdAttachmentValidationResult {
  if (file.size > MHD_ATTACHMENT_MAX_SIZE_BYTES) {
    return { valid: false, error: `File exceeds maximum size of ${MHD_ATTACHMENT_MAX_SIZE_MB} MB` };
  }
  if (!MHD_ATTACHMENT_ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not permitted` };
  }
  if (file.name.length > 255) {
    return { valid: false, error: `File name must be 255 characters or fewer` };
  }
  return { valid: true };
}
