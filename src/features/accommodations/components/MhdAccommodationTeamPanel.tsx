import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { useMhdDirectReports } from '@/features/people/Hook';
import { useMhdAccommodationManagerInstructions } from '../Hook';

interface MhdAccommodationTeamPanelProps {
  /** The signed-in manager's own person id. */
  managerPersonId: string | null;
}

/**
 * What a manager is told about the accommodations in effect for their direct
 * reports: the instruction to follow and the dates it covers, and nothing else.
 * The data comes from `mhd_accommodation_manager_projection`, which selects only
 * the active implementation's operational fields — no diagnosis, no functional
 * limitation, no case narrative, no request source — and refuses anyone who is not
 * the person's manager (or privileged). Nothing on this panel identifies why an
 * accommodation exists.
 *
 * Renders nothing for someone with no direct reports, and nothing for a report
 * with no active instruction, so it never signals that a person has a case.
 */
export function MhdAccommodationTeamPanel({ managerPersonId }: MhdAccommodationTeamPanelProps) {
  const reports = useMhdDirectReports(managerPersonId);
  const people = reports.data ?? [];

  if (!managerPersonId || people.length === 0) return null;

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Team Accommodations In Effect" className="mb-0" />
      <p className="text-sm text-muted-foreground">
        Instructions for you to follow, with the dates they cover. This view carries no medical
        information and no reason for the accommodation.
      </p>
      <ul className="space-y-3">
        {people.map((report) => (
          <MhdAccommodationTeamMember
            key={report.personId}
            personId={report.personId}
            displayName={report.displayName}
          />
        ))}
      </ul>
    </MhdCard>
  );
}

function MhdAccommodationTeamMember({
  personId,
  displayName,
}: {
  personId: string;
  displayName: string;
}) {
  const instructions = useMhdAccommodationManagerInstructions(personId);
  const active = instructions.data ?? [];
  if (active.length === 0) return null;

  return (
    <li className="space-y-1 text-sm">
      <p className="font-medium text-foreground">{displayName}</p>
      {active.map((item) => (
        <div key={item.implementationId} className="rounded-md border border-border px-3 py-2">
          <p className="text-foreground">{item.managerInstruction}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            From {item.startDate}
            {item.endDate ? ` to ${item.endDate}` : ', ongoing'}
            {item.reviewDueDate ? ` · Review due ${item.reviewDueDate}` : ''}
          </p>
        </div>
      ))}
    </li>
  );
}

export default MhdAccommodationTeamPanel;
