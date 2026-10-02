import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { FileText, FolderLock, ShieldAlert } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdPaginationControls } from '@/components/ui/MhdPagination';
import { mhdPaginationSummary, useMhdPagination } from '@/components/ui/MhdPaginationUtils';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import { mhdFormService } from '@/features/forms/Service';
import type { MhdEmployeeFileSubmissionRecord } from '@/features/forms/Types';
import { useMhdEmployeeFileDocuments } from '@/features/documents/Hook';
import type { MhdEmployeeFileDocument } from '@/features/documents/Types';
import { mhdPersonService } from '@/features/people/Service';
import type { MhdEmployeeFileTypeDefinition } from '../Types';
import { MHD_EMPLOYEE_FILE_TYPES } from '../Types';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not Submitted';
}

function formatGeneratedDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not Generated';
}

// SME review addition (Stage 6b review): audit_certificates.status only ever
// takes 'PENDING' | 'GENERATED' | 'MERGED' | 'FAILED' (migration 0108's
// check constraint) — 'MERGED' is the actual terminal success status
// mhd_complete_audit_certificate sets, not 'COMPLETED', which never occurs.
const CERTIFICATE_STATUS_VARIANTS: Record<string, MhdBadgeVariant> = {
  PENDING: 'warning',
  GENERATED: 'success',
  MERGED: 'success',
  FAILED: 'error',
};

function EmployeeFileTable({
  fileType,
  records,
  personId,
  documents,
  documentsAvailable,
}: {
  fileType: MhdEmployeeFileTypeDefinition;
  records: MhdEmployeeFileSubmissionRecord[];
  personId: string;
  documents: MhdEmployeeFileDocument[];
  /** False while generated documents are loading or failed to load (the page reports a failure once). */
  documentsAvailable: boolean;
}) {
  const pagination = useMhdPagination(records.length, {
    resetKey: `${records.length}:${records[0]?.id ?? ''}`,
  });
  const documentPagination = useMhdPagination(documents.length, {
    resetKey: `${documents.length}:${documents[0]?.id ?? ''}`,
  });

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
              Source: Submitted Forms · Category: {fileType.key}
            </p>
          </div>
          <Link
            to={`/employees/${personId}/files/new?category=${encodeURIComponent(fileType.key)}`}
            className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
          >
            New Record
          </Link>
        </div>
      </div>

      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Record</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Submitted By</MhdTh>
            <MhdTh>Submitted</MhdTh>
            <MhdTh>Attachments</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <MhdTr>
              <MhdTd colSpan={6} className="text-center text-muted-foreground">
                No Submitted Form Records In This Employee File Type.
              </MhdTd>
            </MhdTr>
          ) : (
            pagination.sliceItems(records).map((record) => (
              <MhdTr
                key={record.id}
                to={`/forms/${record.formId}/submissions?submissionId=${record.id}`}
              >
                <MhdTd>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" aria-hidden />
                    <div>
                      <p className="font-semibold text-foreground">{record.formName}</p>
                      <p className="text-xs text-muted-foreground">{record.referenceId}</p>
                    </div>
                  </div>
                </MhdTd>
                <MhdTd>
                  <div className="space-y-2">
                    <p>{record.status}</p>
                    {record.certificateStatus ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <MhdBadge
                          variant={
                            CERTIFICATE_STATUS_VARIANTS[record.certificateStatus] ?? 'neutral'
                          }
                        >
                          {record.certificateStatus}
                        </MhdBadge>
                        <MhdBadge
                          variant={record.certificateDigitallySigned ? 'success' : 'warning'}
                        >
                          {record.certificateDigitallySigned
                            ? 'Digitally signed'
                            : 'Hash-verified only'}
                        </MhdBadge>
                        {record.certificateVerificationCode ? (
                          <span className="break-all text-xs text-muted-foreground">
                            {record.certificateVerificationCode}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </MhdTd>
                <MhdTd>{record.submitterDisplayName}</MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {formatDate(record.submittedAt)}
                </MhdTd>
                <MhdTd>{record.attachmentCount}</MhdTd>
                <MhdTableActions
                  viewTo={`/forms/${record.formId}/submissions?submissionId=${record.id}`}
                />
              </MhdTr>
            ))
          )}
        </tbody>
      </MhdTable>
      <MhdTableFooter
        summary={mhdPaginationSummary(pagination, records.length, `${fileType.label} Records`)}
      >
        <MhdPaginationControls pagination={pagination} />
      </MhdTableFooter>

      {fileType.key !== 'medical' && documentsAvailable ? (
        <div className="border-t border-border">
          <div className="border-b border-border bg-card px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">
              Generated Documents ({documents.length})
            </h3>
          </div>
          {documents.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              No generated documents in this employee file type.
            </p>
          ) : (
            <>
              <MhdTable>
                <thead>
                  <tr>
                    <MhdTh>Document</MhdTh>
                    <MhdTh>Status</MhdTh>
                    <MhdTh>Format</MhdTh>
                    <MhdTh>Generated</MhdTh>
                    <MhdTh>Created By</MhdTh>
                    <MhdActionsTh />
                  </tr>
                </thead>
                <tbody>
                  {documentPagination.sliceItems(documents).map((document) => (
                    <MhdTr key={document.id}>
                      <MhdTd>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-accent" aria-hidden />
                          <div>
                            <p className="font-semibold text-foreground">{document.templateName}</p>
                            <p className="text-xs text-muted-foreground">{document.referenceId}</p>
                          </div>
                        </div>
                      </MhdTd>
                      <MhdTd>
                        <div className="space-y-1">
                          <MhdBadge
                            variant={
                              document.status === 'GENERATED' || document.status === 'SIGNED'
                                ? 'success'
                                : 'neutral'
                            }
                          >
                            {document.status}
                          </MhdBadge>
                          {document.status === 'SIGNED' ? (
                            <p className="text-xs text-muted-foreground">Signed</p>
                          ) : null}
                        </div>
                      </MhdTd>
                      <MhdTd>{document.outputFormat}</MhdTd>
                      <MhdTd className="whitespace-nowrap text-muted-foreground">
                        {formatGeneratedDate(document.generatedAt)}
                      </MhdTd>
                      <MhdTd>{document.createdByName ?? 'Unknown'}</MhdTd>
                      <MhdTd className="whitespace-nowrap text-right" data-row-click-ignore>
                        {document.outputDriveFileId ? (
                          <a
                            href={`https://drive.google.com/file/d/${document.outputDriveFileId}/view`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
                          >
                            View Document
                          </a>
                        ) : null}
                      </MhdTd>
                    </MhdTr>
                  ))}
                </tbody>
              </MhdTable>
              <MhdTableFooter
                summary={mhdPaginationSummary(
                  documentPagination,
                  documents.length,
                  `${fileType.label} Generated Documents`,
                )}
              >
                <MhdPaginationControls pagination={documentPagination} />
              </MhdTableFooter>
            </>
          )}
        </div>
      ) : null}
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
  const recordsQuery = useQuery({
    queryKey: ['mhd-employee-file-submissions', personId],
    queryFn: () => mhdFormService.listEmployeeFileSubmissions(personId!),
    enabled: Boolean(personId),
  });
  const documentsQuery = useMhdEmployeeFileDocuments(personId ?? null);

  const recordsByType = useMemo(() => {
    const grouped = new Map<
      MhdEmployeeFileTypeDefinition['key'],
      MhdEmployeeFileSubmissionRecord[]
    >();
    for (const fileType of MHD_EMPLOYEE_FILE_TYPES) {
      grouped.set(fileType.key, []);
    }
    for (const record of recordsQuery.data ?? []) {
      grouped.get(record.employeeFileCategory)?.push(record);
    }
    return grouped;
  }, [recordsQuery.data]);

  if (!personId) {
    return (
      <div className="space-y-4">
        <MhdPageHeader title="Employee Not Found" backTo="/employees" backLabel="Employee Files" />
      </div>
    );
  }

  if (personQuery.isLoading || recordsQuery.isLoading) {
    return (
      <MhdCard className="p-6 text-sm text-muted-foreground">
        Loading Employee File Cabinet...
      </MhdCard>
    );
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
            className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
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
              Employee Files are populated by submitted forms. If a form includes an upload field,
              the uploaded document is stored with that form submission and surfaced here as part of
              the employee record.
            </p>
          </div>
        </div>
        {recordsQuery.isError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {recordsQuery.error instanceof Error
              ? recordsQuery.error.message
              : 'Unable To Load Employee File Records.'}
          </p>
        ) : null}
        {documentsQuery.isError ? (
          <p
            role="alert"
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            Generated documents could not be loaded.
          </p>
        ) : null}
      </MhdCard>

      <div className="space-y-5">
        {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
          <EmployeeFileTable
            key={fileType.key}
            fileType={fileType}
            personId={person.id}
            records={recordsByType.get(fileType.key) ?? []}
            documents={(documentsQuery.data ?? []).filter(
              (document) => document.employeeFileCategory === fileType.key,
            )}
            documentsAvailable={!documentsQuery.isLoading && !documentsQuery.isError}
          />
        ))}
      </div>
    </div>
  );
}
