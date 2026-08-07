import { CalendarClock, FileText, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import type { MhdCompanyId } from '@/features/companies/Types';
import { useMhdActivities } from '../Hook';
import { MhdActivityStatusBadge } from './MhdActivityStatusBadge';
import { MhdActivityTypeBadge } from './MhdActivityTypeBadge';
import { mhdFormatDateTime } from '@/utils/mhdDateFormat';

interface Props {
  taskId: string;
  companyId: MhdCompanyId;
}

export function MhdTaskActivitiesPanel({ taskId, companyId }: Props) {
  const activitiesQuery = useMhdActivities({
    companyId,
    personId: 'ALL',
    taskId,
    activityType: 'ALL',
    status: 'ALL',
    searchTerm: '',
    from: '',
    to: '',
  });

  if (activitiesQuery.isLoading) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Loading activities...</p>;
  }

  if (activitiesQuery.error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {(activitiesQuery.error as Error).message}
      </div>
    );
  }

  const activities = activitiesQuery.data ?? [];

  if (activities.length === 0) {
    return <MhdEmptyState icon={CalendarClock} title="No activities linked to this task." />;
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 10).map((activity) => (
        <article
          key={activity.id}
          className="rounded-md border border-neutral-200 bg-background p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <MhdActivityTypeBadge activityType={activity.activityType} />
            <MhdActivityStatusBadge status={activity.status} />
          </div>
          <Link
            to={`/activities/${activity.id}`}
            className="mt-2 block font-medium text-accent hover:text-accent-hover"
          >
            {activity.title}
          </Link>
          <p className="text-xs text-muted-foreground">{activity.referenceId}</p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              {activity.scheduledAt
                ? `Scheduled: ${mhdFormatDateTime(activity.scheduledAt)}`
                : 'Unscheduled'}
            </p>
            {activity.personDisplayName ? <p>Person: {activity.personDisplayName}</p> : null}
            {activity.participantDisplayNames.length > 0 ? (
              <p>Participants: {activity.participantDisplayNames.join(', ')}</p>
            ) : null}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {activity.noteCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {activity.attachmentCount}
            </span>
          </div>
        </article>
      ))}
      {activities.length > 10 ? (
        <p className="text-xs text-muted-foreground">
          Showing 10 of {activities.length} linked activities.
        </p>
      ) : null}
    </div>
  );
}
