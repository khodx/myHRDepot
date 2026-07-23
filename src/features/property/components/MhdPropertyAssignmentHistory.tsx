import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import type { MhdPropertyAssignment } from '../Types';
import { MhdPropertyAssignmentBadge } from './MhdPropertyAssignmentBadge';

interface MhdPropertyAssignmentHistoryProps {
  assignments: MhdPropertyAssignment[];
}

function renderLifecycleSummary(assignment: MhdPropertyAssignment): string {
  switch (assignment.status) {
    case 'RETURNED':
      return `Returned ${new Date(assignment.returnedAt ?? assignment.issuedAt).toLocaleDateString()} to ${assignment.receiverDisplayName ?? assignment.receivedBy ?? 'Unknown receiver'}`;
    case 'LOST':
      return `Marked lost ${new Date(assignment.returnedAt ?? assignment.issuedAt).toLocaleDateString()} by ${assignment.receiverDisplayName ?? assignment.receivedBy ?? 'Unknown actor'}`;
    case 'DAMAGED':
      return `Marked damaged ${new Date(assignment.returnedAt ?? assignment.issuedAt).toLocaleDateString()} by ${assignment.receiverDisplayName ?? assignment.receivedBy ?? 'Unknown actor'}`;
    default:
      return 'Still issued';
  }
}

export function MhdPropertyAssignmentHistory({ assignments }: MhdPropertyAssignmentHistoryProps) {
  if (assignments.length === 0) {
    return (
      <MhdCard className="border-dashed">
        <MhdEmptyState icon={History} title="No assignment history yet." />
      </MhdCard>
    );
  }

  return (
    <ol className="space-y-3">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium text-foreground">
                <Link to={`/people/${assignment.personId}`} className="hover:text-accent-hover">
                  {assignment.personDisplayName}
                </Link>
                {' '}· {assignment.quantity} unit{assignment.quantity === 1 ? '' : 's'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{assignment.referenceId}</div>
            </div>
            <MhdPropertyAssignmentBadge status={assignment.status} />
          </div>

          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>Issued {new Date(assignment.issuedAt).toLocaleDateString()} by {assignment.issuerDisplayName ?? assignment.issuedBy}</p>
            <p>{renderLifecycleSummary(assignment)}</p>
          </div>

          {assignment.issuanceConditionNotes ? (
            <p className="mt-3 text-sm text-muted-foreground">Issued condition: {assignment.issuanceConditionNotes}</p>
          ) : null}
          {assignment.returnConditionNotes ? (
            <p className="mt-1 text-sm text-muted-foreground">Disposition notes: {assignment.returnConditionNotes}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
