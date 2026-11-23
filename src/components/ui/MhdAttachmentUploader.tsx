import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdDocumentToRichHtml, mhdPlainTextToRichHtml } from '@/components/ui/MhdRichTextUtils';
import type { MhdDraftController } from '@/features/drafts/Hook';
import {
  MHD_ATTACHMENT_ALLOWED_MIME_TYPES,
  MHD_ATTACHMENT_MAX_SIZE_MB,
  mhdValidateAttachment,
} from '@/features/attachments/Types';
import { MhdAttachmentFileIcon } from './MhdAttachmentFileIcon';

interface Props {
  isUploading: boolean;
  onUpload: (file: File, descriptionRichText: unknown, descriptionPlainText: string) => void;
  /** Save and resume for the description. The file itself cannot be stored, so it is chosen again after resuming. */
  draft?: MhdDraftController;
}

// Lives under components/ui (not features/attachments/components) because it is embedded by
// more than one feature (Task and Activity attachments panels) -- the mhd-feature-boundary lint
// rule only allows cross-feature imports of a feature's public contract (Service/Types/Hook/
// Schemas), not its internal components, so a genuinely shared piece of UI belongs here rather
// than reached into via a components/ path. It still imports MHD_ATTACHMENT_ALLOWED_MIME_TYPES /
// mhdValidateAttachment from '@/features/attachments/Types' -- that's the contract file, so it's
// an allowed cross-feature import.
export function MhdAttachmentUploader({ isUploading, onUpload, draft }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [descriptionPlainText, setDescriptionPlainText] = useState('');
  const [descriptionDocument, setDescriptionDocument] = useState<unknown>(null);

  function getDraftValues() {
    return { descriptionRichText: descriptionDocument, descriptionPlainText };
  }

  function restoreDraft(payload: Record<string, unknown>) {
    const plainText =
      typeof payload.descriptionPlainText === 'string' ? payload.descriptionPlainText : '';
    const document = payload.descriptionRichText ?? null;
    setDescriptionPlainText(plainText);
    setDescriptionDocument(document);
    setDescriptionHtml(
      document ? mhdDocumentToRichHtml(document, plainText) : mhdPlainTextToRichHtml(plainText),
    );
  }

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
    if (!pendingFile || !descriptionPlainText.trim()) return;
    onUpload(pendingFile, descriptionDocument, descriptionPlainText);
    setPendingFile(null);
    setDescriptionHtml('');
    setDescriptionPlainText('');
    setDescriptionDocument(null);
  }

  function handleCancelPending() {
    setPendingFile(null);
    setValidationError(null);
    setDescriptionHtml('');
    setDescriptionPlainText('');
    setDescriptionDocument(null);
  }

  return (
    <div className="space-y-3">
      {draft ? <MhdDraftBanner draft={draft} onRestore={restoreDraft} /> : null}
      <div
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
          dragActive
            ? 'border-accent bg-accent-tint'
            : 'border-border bg-muted hover:border-muted-foreground'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop or <span className="font-medium text-accent">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Max {MHD_ATTACHMENT_MAX_SIZE_MB} MB · PDF, Word, Excel, images, CSV, ZIP
        </p>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={MHD_ATTACHMENT_ALLOWED_MIME_TYPES.join(',')}
          onChange={handleInputChange}
        />
      </div>

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}

      {draft && !pendingFile && descriptionPlainText ? (
        <div className="space-y-3 rounded-md border border-border bg-card p-3">
          <MhdRichTextEditor
            label="Description (required)"
            html={descriptionHtml}
            onChange={(html, plainText, document) => {
              setDescriptionHtml(html);
              setDescriptionPlainText(plainText);
              setDescriptionDocument(document);
            }}
            minHeightClassName="min-h-24"
            placeholder="Describe this record..."
          />
          <p className="text-xs text-muted-foreground">
            Choose the file again above to finish uploading.
          </p>
        </div>
      ) : null}

      {pendingFile && (
        <div className="space-y-3 rounded-md border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <MhdAttachmentFileIcon
              mimeType={pendingFile.type}
              className="h-5 w-5 text-muted-foreground shrink-0"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
              {pendingFile.name}
            </span>
            <button
              type="button"
              onClick={handleCancelPending}
              className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <MhdRichTextEditor
            label="Description (required)"
            html={descriptionHtml}
            onChange={(html, plainText, document) => {
              setDescriptionHtml(html);
              setDescriptionPlainText(plainText);
              setDescriptionDocument(document);
            }}
            minHeightClassName="min-h-24"
            placeholder="Describe this record..."
          />

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleConfirmUpload}
              disabled={isUploading || !descriptionPlainText.trim()}
              className="shrink-0 px-3 py-1.5 text-xs"
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      )}
      {draft ? (
        <div className="flex flex-wrap items-center gap-3">
          <MhdSaveDraftButton
            draft={draft}
            getValues={getDraftValues}
            disabled={!descriptionPlainText.trim()}
          />
        </div>
      ) : null}
    </div>
  );
}
