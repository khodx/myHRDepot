import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { MhdPersonForm } from '@/features/people/components/MhdPersonForm';
import { mhdPersonService } from '@/features/people/Service';

export function MhdPersonFormPage() {
  const { personId } = useParams<{ personId?: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const actorUserId = profile?.userId ?? '';
  const isEdit = Boolean(personId);
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);

  const personQuery = useQuery({
    queryKey: ['mhd-person-form', personId],
    queryFn: () => mhdPersonService.getPersonById(personId!),
    enabled: isEdit && Boolean(personId),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <MhdPageHeader
        title={isEdit ? 'Edit Person' : 'New Person'}
        description={
          isEdit
            ? 'Update the person record and primary contact methods.'
            : 'Create a person record on its own page.'
        }
        backTo={isEdit && personId ? `/people/${personId}` : '/people'}
        backLabel={isEdit ? 'Person profile' : 'People'}
      />

      {companiesQuery.isLoading || personQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading form...</p>
      ) : companiesQuery.isError || personQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {companiesQuery.error instanceof Error
            ? companiesQuery.error.message
            : personQuery.error instanceof Error
              ? personQuery.error.message
              : 'Unable to load person form.'}
        </p>
      ) : (
        <MhdPersonForm
          companies={companies}
          person={personQuery.data ?? null}
          defaultCompanyId="ALL"
          onCreate={async (input) => {
            const person = await mhdPersonService.createPerson(input, { actorUserId });
            navigate(`/people/${person.id}`);
          }}
          onUpdate={async (input) => {
            const person = await mhdPersonService.updatePerson(input, { actorUserId });
            navigate(`/people/${person.id}`);
          }}
          onCancel={() => navigate(isEdit && personId ? `/people/${personId}` : '/people')}
        />
      )}
    </div>
  );
}
