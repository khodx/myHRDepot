import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdNextPreferredName } from '@/components/ui/MhdPersonIdentityFields';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import type { MhdCompany } from '@/features/companies/Types';
import { useMhdPeoplePicker } from '../Hook';
import type { MhdCreatePersonInput, MhdPerson, MhdUpdatePersonInput } from '../Types';
import { mhdPersonFormSchema, type MhdPersonFormValues } from '../Schemas';
import { MhdPersonCompanySelect } from './MhdPersonCompanySelect';

interface MhdPersonFormProps {
  companies: MhdCompany[];
  person: MhdPerson | null;
  /** The signed-in user's own company — the default for a new person's Company field. */
  currentUserCompanyId: string;
  /** Only platform-org members may change Company; everyone else gets it read-only. */
  canEditCompany: boolean;
  onCreate: (input: MhdCreatePersonInput) => Promise<void>;
  onUpdate: (input: MhdUpdatePersonInput) => Promise<void>;
  onCancel: () => void;
}

const emptyValues: MhdPersonFormValues = {
  companyId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  email: '',
  phone: '',
  mobile: '',
  managerId: '',
};

export function MhdPersonForm({
  companies,
  person,
  currentUserCompanyId,
  canEditCompany,
  onCreate,
  onUpdate,
  onCancel,
}: MhdPersonFormProps) {
  const [values, setValues] = useState<MhdPersonFormValues>(emptyValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const peoplePickerQuery = useMhdPeoplePicker(values.companyId || null);
  const managerOptions = useMemo(() => {
    const options = [
      { id: '', label: 'No manager' },
      ...(peoplePickerQuery.data ?? [])
        .filter((candidate) => candidate.id !== person?.id)
        .map((candidate) => ({
          id: candidate.id,
          label: candidate.displayName,
          sublabel: candidate.primaryEmail ?? candidate.referenceId,
        })),
    ];

    if (
      person?.managerId &&
      !options.some((option) => option.id === person.managerId)
    ) {
      options.push({
        id: person.managerId,
        label: person.managerDisplayName ?? 'Current manager',
        sublabel: undefined,
      });
    }

    return options;
  }, [peoplePickerQuery.data, person]);

  useEffect(() => {
    if (person) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- package pattern: sync form fields from the selected person prop
      setValues({
        companyId: person.companyId,
        firstName: person.firstName,
        middleName: person.middleName ?? '',
        lastName: person.lastName,
        preferredName: person.preferredName ?? '',
        // person.email/phone/mobile no longer exist — these form fields edit
        // the PRIMARY contact_methods row of each type (see Service.ts).
        email: person.primaryEmail ?? '',
        phone: person.primaryPhone ?? '',
        mobile: person.primaryMobile ?? '',
        managerId: person.managerId ?? '',
      });
      return;
    }

    setValues({
      ...emptyValues,
      companyId: canEditCompany ? (companies[0]?.id ?? currentUserCompanyId) : currentUserCompanyId,
    });
  }, [canEditCompany, companies, currentUserCompanyId, person]);

  function updateField(field: keyof MhdPersonFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
      // Preferred name defaults to and mirrors First Name until edited
      // directly — see mhdNextPreferredName.
      ...(field === 'firstName'
        ? { preferredName: mhdNextPreferredName(current.firstName, current.preferredName, value) }
        : null),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = mhdPersonFormSchema.safeParse(values);

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please review the person form.');
      return;
    }

    setIsSaving(true);
    try {
      const input = {
        ...parsed.data,
        managerId: parsed.data.managerId.length > 0 ? parsed.data.managerId : null,
      };

      if (person) {
        await onUpdate({ ...input, personId: person.id });
      } else {
        await onCreate(input);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save person.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-xl border border-border bg-card p-5 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {person ? 'Edit person' : 'New person'}
        </p>
        <h2 className="mt-1 text-lg font-bold text-foreground">
          {person ? person.displayName : 'Create person'}
        </h2>
      </div>

      <MhdFormFieldStack className="mt-5">
        <div>
          <MhdPersonCompanySelect
            companies={companies}
            value={values.companyId}
            onChange={(companyId) => updateField('companyId', companyId)}
            disabled={!canEditCompany}
          />
        </div>
        <label className="block text-sm font-medium text-foreground">
          First name
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Middle name
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.middleName}
            onChange={(event) => updateField('middleName', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Last name
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Preferred name
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.preferredName}
            onChange={(event) => updateField('preferredName', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Email
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Phone
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.phone}
            onChange={(event) => updateField('phone', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Mobile
          <input
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={values.mobile}
            onChange={(event) => updateField('mobile', event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-foreground">
          Manager
          <MhdSearchableSelect
            className="mt-1"
            options={managerOptions}
            value={values.managerId}
            onChange={(managerId) => updateField('managerId', managerId)}
            disabled={!canEditCompany}
            placeholder="No manager"
            emptyMessage="No people match your search."
          />
        </label>
      </MhdFormFieldStack>

      {formError ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      ) : null}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : person ? 'Save changes' : 'Create person'}
        </Button>
      </div>
    </form>
  );
}
