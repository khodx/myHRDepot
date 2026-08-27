import { Button } from '@/components/ui/Button';
import { MhdAvatar } from '@/components/ui/MhdAvatar';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import type { MhdPerson } from '@/features/people/Types';
import { MhdPersonContactMethods } from './MhdPersonContactMethods';

interface MhdPersonDetailsPanelProps {
  person: MhdPerson | null;
  onEdit: () => void;
}

export function MhdPersonDetailsPanel({ person, onEdit }: MhdPersonDetailsPanelProps) {
  if (!person) {
    return (
      <MhdCard className="border-dashed p-5 text-sm text-muted-foreground">
        Select a person to view details.
      </MhdCard>
    );
  }

  return (
    <MhdCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <MhdAvatar name={person.displayName} />
          <div>
            <h2 className="text-xl font-bold text-foreground">{person.displayName}</h2>
            <p className="text-xs text-muted-foreground">{person.referenceId}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="mt-5 space-y-4">
        <MhdDetailField label="Company" value={person.companyName} />
        <MhdDetailField label="Manager" value={person.managerDisplayName} />
        <MhdDetailField label="First name" value={person.firstName} />
        <MhdDetailField label="Middle name" value={person.middleName} />
        <MhdDetailField label="Last name" value={person.lastName} />
        <MhdDetailField label="Preferred name" value={person.preferredName} />
        <MhdDetailField label="Email" value={person.primaryEmail} />
        <MhdDetailField label="Phone" value={person.primaryPhone} />
        <MhdDetailField label="Mobile" value={person.primaryMobile} />
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Showing the primary email/phone/mobile only. A person may have additional contact methods —
        see the contact methods list below to manage all of them.
      </p>
      <MhdPersonContactMethods personId={person.id} />
    </MhdCard>
  );
}
