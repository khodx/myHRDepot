import { AlarmClock, CalendarClock, ListChecks, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import type { MhdActivity } from '../Types';
import { mhdIsActivityOverdue } from '../Types';
import { MhdActivityParticipantChips } from './MhdActivityParticipantChips';
import { MhdActivityStatusBadge } from './MhdActivityStatusBadge';
import { MhdActivityTypeBadge } from './MhdActivityTypeBadge';

interface Props {
  activities: MhdActivity[];
  canMutate?: boolean;
  onDelete?: (activityId: string) => Promise<void>;
}

export function MhdActivityList({ activities, canMutate = false, onDelete }: Props) {
  if (activities.length === 0) {
    return <MhdEmptyState icon={CalendarClock} title="No activities match the current filters." />;
  }

  return (
    <>
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Activity</MhdTh>
            <MhdTh>Type</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Person</MhdTh>
            <MhdTh>Participants</MhdTh>
            <MhdTh>Checklist</MhdTh>
            <MhdTh>Scheduled</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {activities.slice(0, 10).map((activity) => {
            const isOverdue = mhdIsActivityOverdue(activity);
            return (
              <MhdTr key={activity.id}>
                <MhdTd>
                  <Link
                    to={`/activities/${activity.id}`}
                    className="font-medium text-accent hover:text-accent-hover"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {activity.isConfidential ? (
                        <Lock className="h-3.5 w-3.5 text-amber-600" aria-label="Confidential" />
                      ) : null}
                      {activity.title}
                    </span>
                  </Link>
                  <div className="text-xs text-muted-foreground">{activity.referenceId}</div>
                </MhdTd>
                <MhdTd>
                  <MhdActivityTypeBadge activityType={activity.activityType} />
                </MhdTd>
                <MhdTd>
                  <MhdActivityStatusBadge status={activity.status} />
                </MhdTd>
                <MhdTd>
                  {activity.personDisplayName ?? (
                    <span className="text-muted-foreground">Company</span>
                  )}
                </MhdTd>
                <MhdTd>
                  <MhdActivityParticipantChips
                    participants={activity.participantDisplayNames.map((displayName) => ({
                      id: `${activity.id}-${displayName}`,
                      displayName,
                    }))}
                  />
                </MhdTd>
                <MhdTd>
                  {activity.subActivityTotalCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                      {activity.subActivityDoneCount} / {activity.subActivityTotalCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </MhdTd>
                <MhdTd>
                  {activity.scheduledAt ? (
                    <span
                      className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
                    >
                      {isOverdue ? <AlarmClock className="h-4 w-4" aria-label="Overdue" /> : null}
                      {new Date(activity.scheduledAt).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unscheduled</span>
                  )}
                </MhdTd>
                <MhdTableActions
                  viewTo={`/activities/${activity.id}`}
                  onDelete={canMutate && onDelete ? () => onDelete(activity.id) : undefined}
                  deleteConfirmMessage={`Delete activity "${activity.title}"?`}
                />
              </MhdTr>
            );
          })}
        </tbody>
      </MhdTable>
      <MhdTableFooter
        summary={`Showing 1 to ${Math.min(10, activities.length)} of ${activities.length} activities`}
      />
    </>
  );
}
