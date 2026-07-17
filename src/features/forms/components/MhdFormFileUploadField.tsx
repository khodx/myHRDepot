import { useState, type ChangeEvent } from 'react';
import type { MhdFormField as MhdFormFieldType, MhdFormFileValue } from '../Types';
import { mhdIsFormFileValue } from '../Types';
import { mhdFormatFileSize } from '@/features/attachments/Types';
import { MhdFormFieldError } from './MhdFormFieldError';

interface MhdFormFileUploadFieldProps {
  field: MhdFormFieldType;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
  error?: string | null;
  /**
   * Uploads the selected file to Google Drive (via the edge function) and
   * records it against the current submission, returning the stored
   * reference. Absent in preview and read-only contexts, where the input is
   * disabled instead — no bytes ever leave the browser without a submission
   * to attach them to.
   */
  onUploadFile?: (file: File) => Promise<MhdFormFileValue>;
}

/**
 * File-type form field wired to the real Drive upload pipeline. The
 * submission value only ever holds an MhdFormFileValue *reference* (Drive
 * file id + display metadata), never raw file blobs. Upload failures degrade
 * gracefully: the error renders inline, the previous value (and therefore the
 * draft) is preserved, and the user can retry.
 */
export function MhdFormFileUploadField({
  field,
  value,
  onChange,
  required,
  error,
  onUploadFile,
}: MhdFormFileUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileValue = mhdIsFormFileValue(value) ? value : null;
  const isDisabled = !onUploadFile || isUploading;

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const reference = await onUploadFile(file);
      onChange(reference);
    } catch (caught) {
      // Keep the existing value untouched so an in-progress draft is not lost.
      setUploadError(caught instanceof Error ? caught.message : 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-slate-900">
        {field.label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <input
        id={field.id}
        type="file"
        onChange={(event) => void handleFileSelected(event)}
        disabled={isDisabled}
        className="w-full text-sm disabled:opacity-50"
      />
      {isUploading ? <p className="mt-1 text-xs text-slate-500">Uploading...</p> : null}
      {!onUploadFile ? (
        <p className="mt-1 text-xs text-slate-500">File uploads are available when filling out the live form.</p>
      ) : null}
      {fileValue ? (
        <p className="mt-1 text-xs text-slate-500">
          Uploaded:{' '}
          {fileValue.driveWebViewLink ? (
            <a
              href={fileValue.driveWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-700 hover:underline"
            >
              {fileValue.fileName}
            </a>
          ) : (
            <span className="font-medium">{fileValue.fileName}</span>
          )}{' '}
          ({mhdFormatFileSize(fileValue.fileSizeBytes)})
        </p>
      ) : null}
      {uploadError ? <p className="mt-1 text-xs text-red-600">{uploadError}</p> : null}
      <MhdFormFieldError message={error} />
    </div>
  );
}
