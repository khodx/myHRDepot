import type { MhdPerson } from '@/features/people/Types';
import { MhdPersonContactMethods } from './MhdPersonContactMethods';

interface MhdPersonDetailsPanelProps {
  person: MhdPerson | null;
  onEdit: () => void;
}

function MhdDetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value && value.length > 0 ? value : 'Not provided'}</dd>
    </div>
  );
}

export function MhdPersonDetailsPanel({ person, onEdit }: MhdPersonDetailsPanelProps) {
  if (!person) {
    return <aside className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Select a person to view details.</aside>;
  }

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Person record</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{person.displayName}</h2>
          <p className="mt-1 text-xs text-slate-500">{person.referenceId}</p>
        </div>
        <button type="button" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onEdit}>
          Edit
        </button>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <MhdDetailRow label="Company" value={person.companyName} />
        <MhdDetailRow label="First name" value={person.firstName} />
        <MhdDetailRow label="Middle name" value={person.middleName} />
        <MhdDetailRow label="Last name" value={person.lastName} />
        <MhdDetailRow label="Preferred name" value={person.preferredName} />
        <MhdDetailRow label="Email" value={person.primaryEmail} />
        <MhdDetailRow label="Phone" value={person.primaryPhone} />
        <MhdDetailRow label="Mobile" value={person.primaryMobile} />
      </dl>
      <p className="mt-4 text-xs text-slate-500">
        Showing the primary email/phone/mobile only. A person may have additional contact methods —
        see the contact methods list below to manage all of them.
      </p>
      <MhdPersonContactMethods personId={person.id} />
    </aside>
  );
}
