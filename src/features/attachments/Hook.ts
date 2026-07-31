import { useState, useEffect, useCallback } from 'react';
import { mhdAttachmentService } from './Service';
import type { MhdAttachment, MhdAttachmentEntityType } from './Types';

interface UseMhdAttachmentsState {
  attachments: MhdAttachment[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
}

interface UseMhdAttachmentsReturn extends UseMhdAttachmentsState {
  refetch: () => Promise<void>;
  // entityType/entityId are already bound via the hook's own arguments, and driveFileId/
  // driveFolderId/etc. do not exist yet at call time -- mhdAttachmentService.uploadAttachment()
  // performs the Drive upload itself before calling mhd_create_attachment. descriptionRichText/
  // descriptionPlainText are required (the uploaded record's description).
  uploadAttachment: (
    file: File,
    descriptionRichText: unknown,
    descriptionPlainText: string,
  ) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  downloadAttachment: (attachment: MhdAttachment) => Promise<void>;
}

export function useMhdAttachments(
  entityType: MhdAttachmentEntityType,
  entityId: string,
): UseMhdAttachmentsReturn {
  const [state, setState] = useState<UseMhdAttachmentsState>({
    attachments: [],
    isLoading: true,
    isUploading: false,
    error: null,
  });

  const fetchAttachments = useCallback(async () => {
    if (!entityId) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const attachments = await mhdAttachmentService.listAttachments(entityType, entityId);
      setState((prev) => ({ ...prev, attachments, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load attachments',
      }));
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void fetchAttachments();
  }, [fetchAttachments]);

  const uploadAttachment = useCallback(
    async (file: File, descriptionRichText: unknown, descriptionPlainText: string) => {
      setState((prev) => ({ ...prev, isUploading: true, error: null }));
      try {
        await mhdAttachmentService.uploadAttachment(
          entityType,
          entityId,
          file,
          descriptionRichText,
          descriptionPlainText,
        );
        await fetchAttachments();
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Upload failed',
        }));
        throw err;
      } finally {
        setState((prev) => ({ ...prev, isUploading: false }));
      }
    },
    [fetchAttachments, entityType, entityId],
  );

  const deleteAttachment = useCallback(async (attachmentId: string) => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      await mhdAttachmentService.deleteAttachment(attachmentId);
      setState((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((a) => a.id !== attachmentId),
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Delete failed',
      }));
      throw err;
    }
  }, []);

  const downloadAttachment = useCallback(async (attachment: MhdAttachment) => {
    try {
      mhdAttachmentService.downloadAttachment(attachment);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Download failed',
      }));
    }
  }, []);

  return {
    ...state,
    refetch: fetchAttachments,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  };
}
