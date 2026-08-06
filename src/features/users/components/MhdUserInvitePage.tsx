import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFieldLabel, MHD_FIELD_INPUT_CLASS } from '@/components/ui/MhdFieldLabel';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  MhdPersonIdentityFields,
  mhdFormatPersonPhoneInput,
  mhdValidatePersonIdentityFields,
  type MhdPersonIdentityFieldsValues,
} from '@/components/ui/MhdPersonIdentityFields';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdPeople } from '@/features/people/Hook';
import { mhdPersonService } from '@/features/people/Service';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { useMhdInvitePlatformUser } from '@/features/users/Hook';
import { mhdInvitePlatformUserSchema } from '@/features/users/Schemas';

// The three ways to end up with a login+person: link one that already
// exists, create the person as part of this same invite instead of a
// separate trip through People first, or leave it unset entirely and let
// the invitee complete their own profile after first login (see
// MhdCompleteProfilePage / mhd_self_complete_profile).
type MhdInvitePersonMode = 'none' | 'existing' | 'new';

// Mirrors invite-user's VALID_ROLE_NAMES. Assigning 'Platform Admin' is
// further restricted server-side to a caller who is themselves an admin —
// not gated here, since the edge function is the actual authority and every
// other privileged action in this form (isAdmin) follows the same
// let-the-server-reject convention rather than duplicating the check client-side.
const ROLE_NAME_OPTIONS: MhdAuthRoleName[] = [
  'Platform Admin',
  'HR Partner',
  'Client Admin',
  'Client User',
  'Viewer',
];

export function MhdUserInvitePage() {
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleName, setRoleName] = useState<MhdAuthRoleName | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [personMode, setPersonMode] = useState<MhdInvitePersonMode>('none');
  const [existingPersonId, setExistingPersonId] = useState<string | null>(null);
  const [newFirstName, setNewFirstName] = useState('');
  const [newMiddleName, setNewMiddleName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPreferredName, setNewPreferredName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPersonFieldErrors, setNewPersonFieldErrors] = useState<
    Partial<Record<keyof MhdPersonIdentityFieldsValues, string>>
  >({});
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);

  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const peopleState = useMhdPeople({ companyId, searchTerm: '' });
  const inviteUser = useMhdInvitePlatformUser();
  const isSubmitting = inviteUser.isPending || isCreatingPerson;

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
    if (existingPersonId && !peopleState.people.some((person) => person.id === existingPersonId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: clear a selection invalidated by a dependency change
      setExistingPersonId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the company's people list changes
  }, [peopleState.people]);

  function clearNewPersonFieldError(field: keyof MhdPersonIdentityFieldsValues) {
    setNewPersonFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const { [field]: _removed, ...next } = current;
      return next;
    });
  }

  function handleNewPersonFieldChange(field: keyof MhdPersonIdentityFieldsValues, value: string) {
    if (field === 'firstName') {
      setNewFirstName(value);
    } else if (field === 'middleName') {
      setNewMiddleName(value);
    } else if (field === 'lastName') {
      setNewLastName(value);
    } else if (field === 'preferredName') {
      setNewPreferredName(value);
    } else {
      setNewPhone(mhdFormatPersonPhoneInput(value));
    }

    clearNewPersonFieldError(field);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    let personId: string | null = null;

    if (personMode === 'existing') {
      personId = existingPersonId;
    } else if (personMode === 'new') {
      const nextNewPersonFieldErrors = mhdValidatePersonIdentityFields({
        firstName: newFirstName,
        middleName: newMiddleName,
        lastName: newLastName,
        preferredName: newPreferredName,
        phone: newPhone,
      });

      if (Object.keys(nextNewPersonFieldErrors).length > 0) {
        setNewPersonFieldErrors(nextNewPersonFieldErrors);
        return;
      }

      setNewPersonFieldErrors({});

      if (!profile?.userId) {
        setFormError('Unable to determine the current user.');
        return;
      }

      setIsCreatingPerson(true);
      try {
        const person = await mhdPersonService.createPerson(
          {
            companyId,
            firstName: newFirstName,
            middleName: newMiddleName,
            lastName: newLastName,
            preferredName: newPreferredName,
            email,
            phone: newPhone,
          },
          { actorUserId: profile.userId },
        );
        personId = person.id;
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Unable to create the person record.');
        return;
      } finally {
        setIsCreatingPerson(false);
      }
    }

    const result = mhdInvitePlatformUserSchema.safeParse({
      email,
      companyId,
      personId,
      isAdmin,
      roleName,
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Please review the user form.');
      return;
    }

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
            <MhdFieldLabel htmlFor="mhd-user-email" required>
              Email
            </MhdFieldLabel>
            <input
              id="mhd-user-email"
              type="email"
              className={MHD_FIELD_INPUT_CLASS}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <MhdFieldLabel htmlFor="mhd-user-company">Company</MhdFieldLabel>
            <select
              id="mhd-user-company"
              className={MHD_FIELD_INPUT_CLASS}
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              disabled={isSubmitting || companiesQuery.isLoading}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Person record</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="mhd-person-mode"
                  checked={personMode === 'none'}
                  onChange={() => setPersonMode('none')}
                  disabled={isSubmitting}
                />
                Let them complete it themselves
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="mhd-person-mode"
                  checked={personMode === 'existing'}
                  onChange={() => setPersonMode('existing')}
                  disabled={isSubmitting}
                />
                Link an existing person
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="mhd-person-mode"
                  checked={personMode === 'new'}
                  onChange={() => setPersonMode('new')}
                  disabled={isSubmitting}
                />
                Create a new person now
              </label>
            </div>

            {personMode === 'none' ? (
              <p className="text-sm text-muted-foreground">
                No person record is created. After they set their password and sign in, they'll be
                asked to complete their own profile before reaching the rest of the app.
              </p>
            ) : null}

            {personMode === 'existing' ? (
              <select
                aria-label="Linked person"
                className={MHD_FIELD_INPUT_CLASS}
                value={existingPersonId ?? ''}
                onChange={(event) =>
                  setExistingPersonId(event.target.value.length > 0 ? event.target.value : null)
                }
                disabled={isSubmitting || peopleState.isLoading}
              >
                <option value="">Select a person</option>
                {peopleState.people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.displayName}
                  </option>
                ))}
              </select>
            ) : null}

            {personMode === 'new' ? (
              <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
                <MhdPersonIdentityFields
                  idPrefix="mhd-new-person"
                  values={{
                    firstName: newFirstName,
                    middleName: newMiddleName,
                    lastName: newLastName,
                    preferredName: newPreferredName,
                    phone: newPhone,
                  }}
                  onFieldChange={handleNewPersonFieldChange}
                  fieldErrors={newPersonFieldErrors}
                  disabled={isSubmitting}
                  email={{
                    value: email,
                    helpText:
                      "This becomes this person's primary email — it's the same address entered above for their login.",
                  }}
                />
              </div>
            ) : null}
          </fieldset>

          <div>
            <MhdFieldLabel htmlFor="mhd-user-role">Initial role</MhdFieldLabel>
            <select
              id="mhd-user-role"
              className={MHD_FIELD_INPUT_CLASS}
              value={roleName ?? ''}
              onChange={(event) =>
                setRoleName(
                  event.target.value.length > 0 ? (event.target.value as MhdAuthRoleName) : null,
                )
              }
              disabled={isSubmitting}
            >
              <option value="">No role (assign later)</option>
              {ROLE_NAME_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Without a role, the login can sign in but can't reach any role-gated page until one
              is assigned.
            </p>
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
            <Button
              variant="secondary"
              onClick={() => navigate('/users')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting...' : 'Invite user'}
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
