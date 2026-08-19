import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdPaginationSummary, MhdPaginationControls, useMhdPagination } from '@/components/ui/MhdPagination';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import { cn } from '@/utils/cn';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdFormService } from '@/features/forms/Service';
import { mhdPersonService } from '@/features/people/Service';
import { useMhdEmployeeFileCategoryDefault } from '../Hook';
import {
  MHD_EMPLOYEE_FILE_TYPES,
  mhdEmployeeFileLabelForKey,
  mhdIsEmployeeFileTypeKey,
} from '../Types';

export function MhdEmployeeFileNewRecordPage() {
  const { personId } = useParams<{ personId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useMhdAuth();
  const categoryValue = searchParams.get('category');
  const category = mhdIsEmployeeFileTypeKey(categoryValue) ? categoryValue : null;

  const personQuery = useQuery({
    queryKey: ['mhd-employee-file-new-person', personId],
    queryFn: () => mhdPersonService.getPersonById(personId!),
    enabled: Boolean(personId),
  });
  // Checked before the picker's own form list loads: when the company has
  // designated a canonical form for this category, the picker never needs to
  // render at all, so its own query stays disabled until this one resolves
  // to "no default" (see the `enabled` condition on `formsQuery` below).
  const defaultFormQuery = useMhdEmployeeFileCategoryDefault(profile?.companyId ?? null, category);
  const hasResolvedNoDefault = defaultFormQuery.isSuccess
    ? !defaultFormQuery.data
    : defaultFormQuery.isError;
  const formsQuery = useQuery({
    queryKey: ['mhd-employee-file-category-forms', profile?.companyId, category],
    queryFn: () => mhdFormService.listFormsForCompany(profile!.companyId!, 'ACTIVE'),
    enabled: Boolean(profile?.companyId && category && hasResolvedNoDefault),
  });

  const matchingForms = useMemo(
    () => (formsQuery.data ?? []).filter((form) => form.employeeFileCategory === category),
    [category, formsQuery.data],
  );
  const pagination = useMhdPagination(matchingForms.length, {
    resetKey: `${matchingForms.length}:${matchingForms[0]?.id ?? ''}`,
  });

  // Auto-jump: a canonical form skips the picker entirely. `replace: true` so
  // this picker route never sits in browser history — closing the renderer
  // (which itself calls `navigate(-1)`, see MhdFormModalRoute) lands back on
  // the employee file cabinet, not on a picker page that would immediately
  // redirect again. No `state.backgroundLocation` is passed, so the renderer
  // loads as its own standalone page rather than as a modal over this one
  // (which would keep this auto-redirecting page mounted as the modal's
  // background and re-fire this effect in a loop).
  useEffect(() => {
    if (!personId || !category || !defaultFormQuery.data) return;
    navigate(
      `/forms/${defaultFormQuery.data.formId}/render?employeeFilePersonId=${encodeURIComponent(
        personId,
      )}&employeeFileCategory=${encodeURIComponent(category)}`,
      { replace: true },
    );
  }, [category, defaultFormQuery.data, navigate, personId]);

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

  if (personQuery.isLoading || defaultFormQuery.isLoading) {
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

  // A default resolved: the effect above is about to navigate away. Render a
  // holding state instead of falling through to the picker below, so the
  // "no forms yet" empty state (formsQuery is deliberately still disabled
  // here) never has a chance to flash before the redirect takes effect.
  if (defaultFormQuery.data) {
    return (
      <MhdCard className="p-6 text-sm text-muted-foreground">
        Opening The Default Form For This Category...
      </MhdCard>
    );
  }

  // No default (hasResolvedNoDefault is true, which is what unlocked this
  // query in the first place) — falling through to the original picker,
  // completely unchanged from here down. Its own loading state, gated
  // separately from personQuery/defaultFormQuery above since it only starts
  // fetching once a default is confirmed absent.
  if (formsQuery.isLoading) {
    return (
      <MhdCard className="p-6 text-sm text-muted-foreground">
        Loading Employee File Forms...
      </MhdCard>
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
            className={cn(buttonBaseClasses, buttonVariantClasses.secondary)}
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
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState
            icon={ClipboardList}
            title="No Active Forms For This File Type"
            description={`Create or publish a form with Employee File Destination set to ${categoryLabel}.`}
            action={
              <Link
                to="/forms/new"
                className={cn(buttonBaseClasses, buttonVariantClasses.primary)}
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
              {pagination.sliceItems(matchingForms).map((form) => (
                <MhdTr
                  key={form.id}
                  to={`/forms/${form.id}/render?employeeFilePersonId=${encodeURIComponent(
                    person.id,
                  )}&employeeFileCategory=${encodeURIComponent(category)}`}
                  state={{ backgroundLocation: location }}
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
                      state={{ backgroundLocation: location }}
                      className={cn(
                        buttonBaseClasses,
                        buttonVariantClasses.secondary,
                        'h-9 px-3 text-[16.8px]',
                      )}
                    >
                      Use Form
                    </Link>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, matchingForms.length, 'Forms')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
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
