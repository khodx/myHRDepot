import { useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { FolderLock, Paperclip, ShieldAlert, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAttachments } from '@/features/attachments/Hook';
import type { MhdAttachment } from '@/features/attachments/Types';
import {
  MHD_ATTACHMENT_ALLOWED_MIME_TYPES,
  mhdFormatFileSize,
  mhdValidateAttachment,
} from '@/features/attachments/Types';
import { mhdPersonService } from '@/features/people/Service';
import type { MhdEmployeeFileTypeDefinition } from '../Types';
import { MHD_EMPLOYEE_FILE_TYPES } from '../Types';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function EmployeeFileUploader({
  isUploading,
  onUpload,
}: {
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;

    const validation = mhdValidateAttachment(file);
    if (!validation.valid) {
      setValidationError(validation.error ?? 'File Is Not Valid.');
      setPendingFile(null);
      return;
    }

    setValidationError(null);
    setPendingFile(file);
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted p-4 text-center transition hover:border-accent-border hover:bg-accent-soft/60">
        <Upload className="mb-2 h-5 w-5 text-accent" aria-hidden />
        <span className="text-sm font-semibold text-accent">Select File</span>
        <span className="mt-1 text-xs text-muted-foreground">Max 25 MB · PDF, Office, Images, CSV, ZIP</span>
        <input
          type="file"
          className="sr-only"
          accept={MHD_ATTACHMENT_ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileChange}
        />
      </label>

      {validationError ? <p className="text-sm text-red-600">{validationError}</p> : null}

      {pendingFile ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{pendingFile.name}</span>
          <Button
            type="button"
            disabled={isUploading}
            className="h-8 px-3 text-xs"
            onClick={() => {
              onUpload(pendingFile);
              setPendingFile(null);
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EmployeeFileTable({ fileType, personId }: { fileType: MhdEmployeeFileTypeDefinition; personId: string }) {
  const {
    attachments,
    isLoading,
    isUploading,
    error,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useMhdAttachments(fileType.entityType, personId);

  async function handleDelete(attachment: MhdAttachment) {
    if (!window.confirm(`Delete "${attachment.originalFileName}"?`)) return;
    await deleteAttachment(attachment.id);
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <div className="border-b border-border bg-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">{fileType.label}</h2>
              {fileType.restricted ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  <ShieldAlert className="h-3 w-3" aria-hidden />
                  Restricted
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{fileType.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Polymorphic Target: {fileType.entityType} / {personId}
            </p>
          </div>
          <div className="min-w-72 max-w-sm flex-1">
            <EmployeeFileUploader
              isUploading={isUploading}
              onUpload={(file) => {
                void uploadAttachment(file);
              }}
            />
          </div>
        </div>
        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <MhdTable>
        <thead>
          <tr>
            <MhdTh>File</MhdTh>
            <MhdTh>Size</MhdTh>
            <MhdTh>Uploaded By</MhdTh>
            <MhdTh>Uploaded</MhdTh>
            <MhdTh>Actions</MhdTh>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <MhdTr>
              <MhdTd colSpan={5} className="text-center text-muted-foreground">
                Loading Files...
              </MhdTd>
            </MhdTr>
          ) : attachments.length === 0 ? (
            <MhdTr>
              <MhdTd colSpan={5} className="text-center text-muted-foreground">
                No Files In This Employee File Type.
              </MhdTd>
            </MhdTr>
          ) : (
            attachments.map((attachment) => (
              <MhdTr key={attachment.id}>
                <MhdTd>
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-accent" aria-hidden />
                    <div>
                      <p className="font-semibold text-foreground">{attachment.originalFileName}</p>
                      <p className="text-xs text-muted-foreground">{attachment.referenceId}</p>
                    </div>
                  </div>
                </MhdTd>
                <MhdTd>{mhdFormatFileSize(attachment.fileSizeBytes)}</MhdTd>
                <MhdTd>{attachment.uploaderDisplayName ?? 'Unknown'}</MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {formatDate(attachment.uploadedAt)}
                </MhdTd>
                <MhdTd>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void downloadAttachment(attachment)}
                      className="rounded-md border border-accent-border px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft"
                    >
                      View
                    </button>
                    {attachment.canDelete ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(attachment)}
                        className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </MhdTd>
              </MhdTr>
            ))
          )}
        </tbody>
      </MhdTable>
      <MhdTableFooter
        summary={`Showing ${attachments.length === 0 ? 0 : 1} To ${attachments.length} Of ${
          attachments.length
        } ${fileType.label} Files`}
      />
    </MhdCard>
  );
}

export function MhdEmployeeFileCabinetPage() {
  const { personId } = useParams<{ personId: string }>();
  const personQuery = useQuery({
    queryKey: ['mhd-employee-file-person', personId],
    queryFn: () => mhdPersonService.getPersonById(personId!),
    enabled: Boolean(personId),
  });

  if (!personId) {
    return (
      <div className="space-y-4">
        <MhdPageHeader title="Employee Not Found" backTo="/employees" backLabel="Employee Files" />
      </div>
    );
  }

  if (personQuery.isLoading) {
    return <MhdCard className="p-6 text-sm text-muted-foreground">Loading Employee File Cabinet...</MhdCard>;
  }

  if (personQuery.isError || !personQuery.data) {
    return (
      <div className="space-y-4">
        <MhdPageHeader title="Employee Not Found" backTo="/employees" backLabel="Employee Files" />
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {personQuery.error instanceof Error
            ? personQuery.error.message
            : 'Unable To Load Employee File Cabinet.'}
        </p>
      </div>
    );
  }

  const person = personQuery.data;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={`${person.displayName} Employee Files`}
        description={`${person.referenceId} · ${person.companyName ?? 'Company Unavailable'}`}
        backTo="/employees"
        backLabel="Employee Files"
        actions={
          <Link
            to={`/people/${person.id}`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent-border bg-card px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            View Person Profile
          </Link>
        }
      />

      <MhdCard className="p-5">
        <div className="flex items-start gap-3">
          <FolderLock className="mt-1 h-5 w-5 text-accent" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-foreground">Employee File Cabinet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each file type below is stored as a separate polymorphic attachment target. This keeps
              the module modular while reusing the existing attachment upload, list, view, and
              delete infrastructure.
            </p>
          </div>
        </div>
      </MhdCard>

      <div className="space-y-5">
        {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
          <EmployeeFileTable key={fileType.key} fileType={fileType} personId={person.id} />
        ))}
      </div>
    </div>
  );
}
