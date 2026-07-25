import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdFormService } from '@/features/forms/Service';
import { mhdPersonService } from '@/features/people/Service';
import {
  MHD_EMPLOYEE_FILE_TYPES,
  mhdEmployeeFileLabelForKey,
  mhdIsEmployeeFileTypeKey,
} from '../Types';

export function MhdEmployeeFileNewRecordPage() {
  const { personId } = useParams<{ personId: string }>();
  const [searchParams] = useSearchParams();
  const { profile } = useMhdAuth();
  const categoryValue = searchParams.get('category');
  const category = mhdIsEmployeeFileTypeKey(categoryValue) ? categoryValue : null;

  const personQuery = useQuery({
    queryKey: ['mhd-employee-file-new-person', personId],
    queryFn: () => mhdPersonService.getPersonById(personId!),
    enabled: Boolean(personId),
  });
  const formsQuery = useQuery({
    queryKey: ['mhd-employee-file-category-forms', profile?.companyId, category],
    queryFn: () => mhdFormService.listFormsForCompany(profile!.companyId!, 'ACTIVE'),
    enabled: Boolean(profile?.companyId && category),
  });

  const matchingForms = useMemo(
    () => (formsQuery.data ?? []).filter((form) => form.employeeFileCategory === category),
    [category, formsQuery.data],
  );

  if (!personId || !category) {
    return (
      <div className="space-y-4">
        <MhdPageHeader
          title="Employee File Category Not Found"
          backTo="/employees"
          backLabel="Employee Files"
        />
      </div>
    );
  }

  if (personQuery.isLoading || formsQuery.isLoading) {
    return (
      <MhdCard className="p-6 text-sm text-muted-foreground">
        Loading Employee File Forms...
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
            : 'Unable To Load Employee File Forms.'}
        </p>
      </div>
    );
  }

  const person = personQuery.data;
  const categoryLabel = mhdEmployeeFileLabelForKey(category);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title={`New ${categoryLabel} Record`}
        description={`Choose a form to submit for ${person.displayName}.`}
        backTo={`/employees/${person.id}`}
        backLabel="Employee File Cabinet"
        actions={
          <Link
            to="/forms/new"
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent-border bg-card px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            Create Form
          </Link>
        }
      />

      <MhdCard className="p-5">
        <p className="text-sm text-muted-foreground">
          Only active forms assigned to{' '}
          <span className="font-semibold text-foreground">{categoryLabel}</span> are listed. The
          selected form will create a submission linked to the employee file.
        </p>
      </MhdCard>

      {formsQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formsQuery.error instanceof Error
            ? formsQuery.error.message
            : 'Unable To Load Employee File Forms.'}
        </p>
      ) : null}

      {matchingForms.length === 0 ? (
        <MhdCard className="border-dashed">
          <MhdEmptyState
            icon={ClipboardList}
            title="No Active Forms For This File Type"
            description={`Create or publish a form with Employee File Destination set to ${categoryLabel}.`}
            action={
              <Link
                to="/forms/new"
                className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover"
              >
                Create Form
              </Link>
            }
          />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Form</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Updated</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {matchingForms.map((form) => (
                <MhdTr
                  key={form.id}
                  to={`/forms/${form.id}/render?employeeFilePersonId=${encodeURIComponent(
                    person.id,
                  )}&employeeFileCategory=${encodeURIComponent(category)}`}
                >
                  <MhdTd>
                    <p className="font-semibold text-foreground">{form.name}</p>
                    <p className="text-xs text-muted-foreground">{form.referenceId}</p>
                  </MhdTd>
                  <MhdTd>{categoryLabel}</MhdTd>
                  <MhdTd>{form.status}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {new Date(form.updatedAt).toLocaleDateString()}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-right">
                    <Link
                      to={`/forms/${form.id}/render?employeeFilePersonId=${encodeURIComponent(
                        person.id,
                      )}&employeeFileCategory=${encodeURIComponent(category)}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-accent-border px-2.5 text-xs font-semibold text-accent transition hover:bg-accent-soft hover:text-accent-hover"
                    >
                      Use Form
                    </Link>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter
            summary={`Showing 1 To ${matchingForms.length} Of ${matchingForms.length} Forms`}
          />
        </MhdCard>
      )}

      <div className="flex flex-wrap gap-2">
        {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => (
          <Link
            key={fileType.key}
            to={`/employees/${person.id}/files/new?category=${fileType.key}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              fileType.key === category
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-card text-muted-foreground hover:border-accent-border'
            }`}
          >
            {fileType.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
