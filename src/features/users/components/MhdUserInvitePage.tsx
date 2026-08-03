import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeople } from '@/features/people/Hook';
import { useMhdInvitePlatformUser } from '@/features/users/Hook';
import { mhdInvitePlatformUserSchema } from '@/features/users/Schemas';

export function MhdUserInvitePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [personId, setPersonId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const peopleState = useMhdPeople({ companyId, searchTerm: '' });
  const inviteUser = useMhdInvitePlatformUser();

  useEffect(() => {
    if (!companyId && companies[0]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: seed a create form from loaded reference data
      setCompanyId(companies[0].id);
    }
  }, [companies, companyId]);

  useEffect(() => {
     
    peopleState.setFilters({ companyId, searchTerm: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only rescope the people list when the selected company changes
  }, [companyId]);

  useEffect(() => {
    // Clear the linked person whenever the company changes to something the
    // current selection no longer belongs to, so a stale cross-company link
    // can never be silently submitted.
    if (personId && !peopleState.people.some((person) => person.id === personId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: clear a selection invalidated by a dependency change
      setPersonId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the company's people list changes
  }, [peopleState.people]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = mhdInvitePlatformUserSchema.safeParse({
      email,
      companyId,
      personId,
      isAdmin,
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Please review the user form.');
      return;
    }

    setFormError(null);
    inviteUser.mutate(result.data, {
      onSuccess: (user) => navigate(`/users/${user.id}`),
    });
  }

  return (
    <div className="mx-auto max-w-[72.8rem] space-y-6">
      <MhdPageHeader
        title="Invite User"
        description="Create a login for someone at a company — this sends them an email to set their password."
        backTo="/users"
        backLabel="Users"
      />

      <MhdCard className="p-5">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-user-email">
              Email
            </label>
            <input
              id="mhd-user-email"
              type="email"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={inviteUser.isPending}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-user-company">
              Company
            </label>
            <select
              id="mhd-user-company"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              disabled={inviteUser.isPending || companiesQuery.isLoading}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-user-person">
              Linked person
            </label>
            <select
              id="mhd-user-person"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={personId ?? ''}
              onChange={(event) =>
                setPersonId(event.target.value.length > 0 ? event.target.value : null)
              }
              disabled={inviteUser.isPending || peopleState.isLoading}
            >
              <option value="">No linked person</option>
              {peopleState.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.displayName}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              checked={isAdmin}
              onChange={(event) => setIsAdmin(event.target.checked)}
              disabled={inviteUser.isPending}
            />
            Platform admin (bypasses company scoping and implicitly holds every role)
          </label>

          {formError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/users')}
              disabled={inviteUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteUser.isPending}>
              {inviteUser.isPending ? 'Inviting...' : 'Invite user'}
            </Button>
          </div>
        </form>
        {companiesQuery.isError || inviteUser.isError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {companiesQuery.error instanceof Error
              ? companiesQuery.error.message
              : inviteUser.error instanceof Error
                ? inviteUser.error.message
                : 'Unable to invite user.'}
          </p>
        ) : null}
      </MhdCard>
    </div>
  );
}
