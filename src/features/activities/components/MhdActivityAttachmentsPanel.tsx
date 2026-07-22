import { useMhdAttachments } from '@/features/attachments/Hook';
import { mhdFormatFileSize, type MhdAttachment } from '@/features/attachments/Types';

interface Props {
  activityId: string;
  readOnly?: boolean;
}

export function MhdActivityAttachmentsPanel({ activityId, readOnly = false }: Props) {
  const { attachments, isLoading, error, isUploading, uploadAttachment, deleteAttachment, downloadAttachment } =
    useMhdAttachments('ACTIVITY', activityId);

  async function handleDelete(attachment: MhdAttachment) {
    if (!window.confirm(`Delete "${attachment.originalFileName}"? This cannot be undone.`)) return;
    try {
      await deleteAttachment(attachment.id);
    } catch {
      // Surfaced through the hook's error state.
    }
  }

  function handleUpload(file: File) {
    uploadAttachment(file).catch(() => {
      // Surfaced through the hook's error state.
    });
  }

  if (isLoading) {
    return <p className="py-4 text-center text-sm text-neutral-500">Loading attachments…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {readOnly ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          You have read-only access to activity attachments.
        </div>
      ) : (
        <label className="block rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{isUploading ? 'Uploading…' : 'Upload attachment'}</span>
          <input
            type="file"
            className="mt-2 block text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleUpload(file);
                event.target.value = '';
              }
            }}
            disabled={isUploading}
          />
        </label>
      )}

      {attachments.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          No attachments yet.
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <article key={attachment.id} className="rounded-md border border-slate-200 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{attachment.originalFileName}</p>
                  <p className="text-xs text-slate-500">
                    {mhdFormatFileSize(attachment.fileSizeBytes)} • Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
                    {attachment.uploaderDisplayName ? ` by ${attachment.uploaderDisplayName}` : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void downloadAttachment(attachment)}
                    className="rounded-md border border-slate-300 bg-card px-3 py-1.5 text-sm font-semibold text-slate-700"
                  >
                    Open
                  </button>
                  {!readOnly && attachment.canDelete ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(attachment)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
