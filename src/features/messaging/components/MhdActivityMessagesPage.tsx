import { Navigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdEntityMessagingPanel } from '@/components/ui/MhdEntityMessagingPanel';
import { MhdActivityRecordTabs } from '@/appshell/components/MhdActivityRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdActivity } from '@/features/activities/Hook';

export function MhdActivityMessagesPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const { profile } = useMhdAuth();
  const activityQuery = useMhdActivity(activityId ?? null);
  const activity = activityQuery.data ?? null;

  if (!activityId) return <Navigate to="/activities" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/activities/${activityId}`}
        backLabel="Activity"
        title="Activity Messages"
        description="Conversation attached to this activity."
      />

      <MhdActivityRecordTabs activityId={activityId} active="messages" />

      {activityQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activity...</p>
      ) : !activity ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {activityQuery.error instanceof Error ? activityQuery.error.message : 'Activity not found'}
        </p>
      ) : (
        <MhdEntityMessagingPanel
          entityType="ACTIVITY"
          entityId={activity.id}
          companyId={activity.companyId}
          currentUserId={profile?.userId ?? null}
          defaultExpanded
        />
      )}
    </div>
  );
}
