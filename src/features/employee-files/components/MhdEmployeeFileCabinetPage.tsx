import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { FileText, FolderLock, ShieldAlert } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import { mhdFormService } from '@/features/forms/Service';
import type { MhdEmployeeFileSubmissionRecord } from '@/features/forms/Types';
import { mhdPersonService } from '@/features/people/Service';
import type { MhdEmployeeFileTypeDefinition } from '../Types';
import { MHD_EMPLOYEE_FILE_TYPES } from '../Types';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'Not Submitted';
}

function EmployeeFileTable({
  fileType,
  records,
  personId,
}: {
  fileType: MhdEmployeeFileTypeDefinition;
  records: MhdEmployeeFileSubmissionRecord[];
  personId: string;
}) {
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
            <MhdTh>Actions</MhdTh>
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
            records.map((record) => (
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
                <MhdTd>{record.status}</MhdTd>
                <MhdTd>{record.submitterDisplayName}</MhdTd>
                <MhdTd className="whitespace-nowrap text-muted-foreground">
                  {formatDate(record.submittedAt)}
                </MhdTd>
                <MhdTd>{record.attachmentCount}</MhdTd>
                <MhdTd>
                  <Link
                    to={`/forms/${record.formId}/submissions?submissionId=${record.id}`}
                    className="rounded-md border border-accent-border px-2.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent-soft"
                  >
                    View
                  </Link>
                </MhdTd>
              </MhdTr>
            ))
          )}
        </tbody>
      </MhdTable>
      <MhdTableFooter
        summary={`Showing ${records.length === 0 ? 0 : 1} To ${records.length} Of ${
          records.length
        } ${fileType.label} Records`}
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
  const recordsQuery = useQuery({
    queryKey: ['mhd-employee-file-submissions', personId],
    queryFn: () => mhdFormService.listEmployeeFileSubmissions(personId!),
    enabled: Boolean(personId),
  });

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
      </MhdCard>

      <div className="space-y-5">
        {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
          <EmployeeFileTable
            key={fileType.key}
            fileType={fileType}
            personId={person.id}
            records={recordsByType.get(fileType.key) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
