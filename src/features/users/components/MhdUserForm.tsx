import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeople } from '@/features/people/Hook';
import { mhdUpdatePlatformUserSchema } from '@/features/users/Schemas';
import type { MhdPlatformUser, MhdUpdatePlatformUserInput } from '@/features/users/Types';

interface MhdUserFormProps {
  user: MhdPlatformUser;
  isSubmitting: boolean;
  /** Only platform-org members may change Company; everyone else gets it read-only. */
  canEditCompany: boolean;
  onSubmit: (values: MhdUpdatePlatformUserInput) => void;
  onCancel?: () => void;
}

export function MhdUserForm({
  user,
  isSubmitting,
  canEditCompany,
  onSubmit,
  onCancel,
}: MhdUserFormProps) {
  const [companyId, setCompanyId] = useState(user.companyId);
  const [personId, setPersonId] = useState<string | null>(user.personId);
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [formError, setFormError] = useState<string | null>(null);

  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const peopleState = useMhdPeople({ companyId, searchTerm: '' });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected user prop
    setCompanyId(user.companyId);
    setPersonId(user.personId);
    setIsAdmin(user.isAdmin);
    setFormError(null);
  }, [user]);

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
    const result = mhdUpdatePlatformUserSchema.safeParse({ companyId, personId, isAdmin });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Please review the user form.');
      return;
    }

    setFormError(null);
    onSubmit(result.data);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <span className="block text-sm font-medium text-slate-700">Email</span>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.email} (not editable here — it belongs to the sign-in account)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-user-company">
          Company
        </label>
        <MhdSearchableSelect
          id="mhd-user-company"
          className="mt-1"
          options={companies.map((company) => ({ id: company.id, label: company.companyName }))}
          value={companyId}
          onChange={setCompanyId}
          disabled={isSubmitting || !canEditCompany}
          placeholder="Select company"
          emptyMessage="No companies match your search."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="mhd-user-person">
          Linked person
        </label>
        <select
          id="mhd-user-person"
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          value={personId ?? ''}
          onChange={(event) => setPersonId(event.target.value.length > 0 ? event.target.value : null)}
          disabled={isSubmitting || peopleState.isLoading}
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
          disabled={isSubmitting}
        />
        Platform admin (bypasses company scoping and implicitly holds every role)
      </label>

      {formError ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
