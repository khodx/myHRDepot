import { Navigate, useParams } from 'react-router-dom';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdEntityMessagingPanel } from '@/components/ui/MhdEntityMessagingPanel';
import { MhdLeaveCaseRecordTabs } from '@/appshell/components/MhdLeaveCaseRecordTabs';
import { mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdLeaveCases } from '@/features/leaves/Hook';

export function MhdLeaveCaseMessagesPage() {
  const { caseId = '' } = useParams<{ caseId: string }>();
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const isPrivileged = mhdLeavesIsPrivileged(roles);
  const selfPersonId = profile?.personId ?? null;

  const cases = useMhdLeaveCases({
    companyId,
    personId: isPrivileged ? null : selfPersonId,
  });
  const leaveCase = (cases.data ?? []).find((candidate) => candidate.id === caseId) ?? null;

  if (!caseId) return <Navigate to="/leaves" replace />;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={`/leaves/${caseId}`}
        backLabel="Leave Case"
        title="Leave Case Messages"
        description="Conversation attached to this leave case."
      />

      <MhdLeaveCaseRecordTabs caseId={caseId} active="messages" />

      {cases.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading case...</p>
      ) : !leaveCase ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Case not found.
        </p>
      ) : (
        <MhdEntityMessagingPanel
          entityType="LEAVE_CASE"
          entityId={leaveCase.id}
          companyId={companyId}
          currentUserId={profile?.userId ?? null}
          defaultExpanded
        />
      )}
    </div>
  );
}
