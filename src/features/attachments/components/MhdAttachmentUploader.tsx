import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { MHD_ATTACHMENT_ALLOWED_MIME_TYPES, mhdValidateAttachment } from '../Types';
import { MhdAttachmentFileIcon } from './MhdAttachmentFileIcon';

interface Props {
  isUploading: boolean;
  onUpload: (file: File) => void;
}

export function MhdAttachmentUploader({ isUploading, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleFile(file: File) {
    const validation = mhdValidateAttachment(file);
    if (!validation.valid) {
      setValidationError(validation.error ?? 'File is not valid');
      setPendingFile(null);
      return;
    }
    setValidationError(null);
    setPendingFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleConfirmUpload() {
    if (!pendingFile) return;
    onUpload(pendingFile);
    setPendingFile(null);
  }

  function handleCancelPending() {
    setPendingFile(null);
    setValidationError(null);
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-2 h-6 w-6 text-neutral-400" />
        <p className="text-sm text-neutral-600">
          Drag & drop or <span className="font-medium text-blue-600">browse</span>
        </p>
        <p className="mt-1 text-xs text-neutral-400">Max 25 MB · PDF, Word, Excel, images, CSV, ZIP</p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={MHD_ATTACHMENT_ALLOWED_MIME_TYPES.join(',')}
          onChange={handleInputChange}
        />
      </div>

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      {pendingFile && (
        <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white p-3">
          <MhdAttachmentFileIcon mimeType={pendingFile.type} className="h-5 w-5 text-neutral-400 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{pendingFile.name}</span>
          <button
            type="button"
            onClick={handleCancelPending}
            className="shrink-0 p-1 text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleConfirmUpload}
            disabled={isUploading}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
}
