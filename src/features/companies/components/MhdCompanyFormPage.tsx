import { useNavigate, useParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompany, useMhdCreateCompany, useMhdUpdateCompany } from '@/features/companies/Hook';
import { MhdCompanyForm } from '@/features/companies/components/MhdCompanyForm';
import { MhdCompanyRecordTabs } from '@/features/companies/components/MhdCompanyRecordTabs';
import type { MhdCreateCompanyInput, MhdUpdateCompanyInput } from '@/features/companies/Types';

export function MhdCompanyFormPage() {
  const { companyId } = useParams<{ companyId?: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const actorUserId = profile?.userId ?? '';
  const isEdit = Boolean(companyId);
  const companyQuery = useMhdCompany(companyId ?? '');
  const createCompany = useMhdCreateCompany({ actorUserId });
  const updateCompany = useMhdUpdateCompany(companyId ?? '', { actorUserId });

  function handleSubmit(values: MhdCreateCompanyInput | MhdUpdateCompanyInput) {
    if (!actorUserId) return;

    if (isEdit && companyId) {
      updateCompany.mutate(values as MhdUpdateCompanyInput, {
        onSuccess: (company) => navigate(`/companies/${company.id}`),
      });
      return;
    }

    createCompany.mutate(values as MhdCreateCompanyInput, {
      onSuccess: (company) => navigate(`/companies/${company.id}`),
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <MhdPageHeader
        title={isEdit ? 'Edit Company' : 'New Company'}
        description={
          isEdit
            ? 'Update the tenant company record.'
            : 'Create a company record on its own page before adding people or work.'
        }
        backTo={isEdit && companyId ? `/companies/${companyId}` : '/companies'}
        backLabel={isEdit ? 'Company profile' : 'Companies'}
      />

      {isEdit && companyId ? <MhdCompanyRecordTabs companyId={companyId} active="edit" /> : null}

      {isEdit && companyQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading company...</p>
      ) : isEdit && companyQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {companyQuery.error instanceof Error
            ? companyQuery.error.message
            : 'Unable to load company.'}
        </p>
      ) : (
        <MhdCard className="p-5">
          <MhdCompanyForm
            company={companyQuery.data ?? null}
            isSubmitting={createCompany.isPending || updateCompany.isPending}
            submitLabel={isEdit ? 'Save changes' : 'Create company'}
            onSubmit={handleSubmit}
            onCancel={() =>
              navigate(isEdit && companyId ? `/companies/${companyId}` : '/companies')
            }
          />
          {createCompany.isError || updateCompany.isError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {createCompany.error instanceof Error
                ? createCompany.error.message
                : updateCompany.error instanceof Error
                  ? updateCompany.error.message
                  : 'Unable to save company.'}
            </p>
          ) : null}
        </MhdCard>
      )}
    </div>
  );
}
