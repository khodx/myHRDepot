import { AlarmClock, CalendarClock, ListChecks, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MhdActivity } from '../Types';
import { mhdIsActivityOverdue } from '../Types';
import { MhdActivityParticipantChips } from './MhdActivityParticipantChips';
import { MhdActivityStatusBadge } from './MhdActivityStatusBadge';
import { MhdActivityTypeBadge } from './MhdActivityTypeBadge';

interface Props {
  activities: MhdActivity[];
}

export function MhdActivityList({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
        <CalendarClock className="mb-2 h-8 w-8" />
        <p className="text-sm">No activities match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2 pr-4">Activity</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Person</th>
            <th className="py-2 pr-4">Participants</th>
            <th className="py-2 pr-4">Checklist</th>
            <th className="py-2 pr-4">Scheduled</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const isOverdue = mhdIsActivityOverdue(activity);
            return (
              <tr key={activity.id} className="border-b last:border-0 hover:bg-neutral-50">
                <td className="py-2 pr-4">
                  <Link to={`/activities/${activity.id}`} className="font-medium hover:underline">
                    <span className="inline-flex items-center gap-1.5">
                      {activity.isConfidential ? <Lock className="h-3.5 w-3.5 text-amber-600" aria-label="Confidential" /> : null}
                      {activity.title}
                    </span>
                  </Link>
                  <div className="text-xs text-neutral-400">{activity.referenceId}</div>
                </td>
                <td className="py-2 pr-4">
                  <MhdActivityTypeBadge activityType={activity.activityType} />
                </td>
                <td className="py-2 pr-4">
                  <MhdActivityStatusBadge status={activity.status} />
                </td>
                <td className="py-2 pr-4">
                  {activity.personDisplayName ?? <span className="text-neutral-400">Company</span>}
                </td>
                <td className="py-2 pr-4">
                  <MhdActivityParticipantChips
                    participants={activity.participantDisplayNames.map((displayName) => ({
                      id: `${activity.id}-${displayName}`,
                      displayName,
                    }))}
                  />
                </td>
                <td className="py-2 pr-4">
                  {activity.subActivityTotalCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-neutral-600">
                      <ListChecks className="h-4 w-4 text-neutral-400" />
                      {activity.subActivityDoneCount} / {activity.subActivityTotalCount}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {activity.scheduledAt ? (
                    <span className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : 'text-neutral-600'}`}>
                      {isOverdue ? <AlarmClock className="h-4 w-4" aria-label="Overdue" /> : null}
                      {new Date(activity.scheduledAt).toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-neutral-400">Unscheduled</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
