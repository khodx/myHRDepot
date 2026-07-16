import { useEffect, useState, type FormEvent } from 'react';
import type { MhdCompany } from '@/features/companies/Types';
import type { MhdCreatePersonInput, MhdPerson, MhdUpdatePersonInput } from '../Types';
import { mhdPersonFormSchema, type MhdPersonFormValues } from '../Schemas';
import { MhdPersonCompanySelect } from './MhdPersonCompanySelect';

interface MhdPersonFormProps {
  companies: MhdCompany[];
  person: MhdPerson | null;
  defaultCompanyId: string;
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
};

export function MhdPersonForm({ companies, person, defaultCompanyId, onCreate, onUpdate, onCancel }: MhdPersonFormProps) {
  const [values, setValues] = useState<MhdPersonFormValues>(emptyValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      });
      return;
    }

    setValues({ ...emptyValues, companyId: defaultCompanyId === 'ALL' ? '' : defaultCompanyId });
  }, [defaultCompanyId, person]);

  function updateField(field: keyof MhdPersonFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
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
      if (person) {
        await onUpdate({ ...parsed.data, personId: person.id });
      } else {
        await onCreate(parsed.data);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save person.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{person ? 'Edit person' : 'New person'}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{person ? person.displayName : 'Create person'}</h2>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <MhdPersonCompanySelect companies={companies} value={values.companyId} onChange={(companyId) => updateField('companyId', companyId)} />
        </div>
        <label className="block text-sm font-medium text-slate-700">
          First name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.firstName} onChange={(event) => updateField('firstName', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Middle name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.middleName} onChange={(event) => updateField('middleName', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Last name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.lastName} onChange={(event) => updateField('lastName', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Preferred name
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.preferredName} onChange={(event) => updateField('preferredName', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.email} onChange={(event) => updateField('email', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.phone} onChange={(event) => updateField('phone', event.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mobile
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={values.mobile} onChange={(event) => updateField('mobile', event.target.value)} />
        </label>
      </div>

      {formError ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}

      <div className="mt-5 flex justify-end gap-3">
        <button type="button" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700" onClick={onCancel}>Cancel</button>
        <button type="submit" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" disabled={isSaving}>
          {isSaving ? 'Saving...' : person ? 'Save changes' : 'Create person'}
        </button>
      </div>
    </form>
  );
}
