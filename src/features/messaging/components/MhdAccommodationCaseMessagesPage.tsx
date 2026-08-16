import { Navigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdEntityMessagingPanel } from '@/components/ui/MhdEntityMessagingPanel';
import { MhdAccommodationCaseRecordTabs } from '@/appshell/components/MhdAccommodationCaseRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAccommodationCase } from '@/features/accommodations/Hook';

export function MhdAccommodationCaseMessagesPage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { profile } = useMhdAuth();
  const detail = useMhdAccommodationCase(caseId);
  const record = detail.data;

  if (!caseId) return <Navigate to="/accommodations" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/accommodations/${caseId}`}
        backLabel="Accommodation Case"
        title="Accommodation Case Messages"
        description="Conversation attached to this accommodation case."
      />

      <MhdAccommodationCaseRecordTabs caseId={caseId} active="messages" />

      {detail.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading case...</p>
      ) : !record ? (
        <p className="text-sm text-muted-foreground">Case not found.</p>
      ) : (
        <MhdEntityMessagingPanel
          entityType="ACCOMMODATION_CASE"
          entityId={record.case.id}
          companyId={record.case.company_id}
          currentUserId={profile?.userId ?? null}
          defaultExpanded
        />
      )}
    </div>
  );
}
