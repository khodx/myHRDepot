import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdApprovalCenter } from './MhdApprovalCenter';

export function MhdApprovalsPage() {
  const { profile } = useMhdAuth();

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Approvals"
        description="Review approvals assigned to you and act on the current level through the live `0019000` Approval Engine RPC surface."
      />

      <MhdCard className="p-6">
        {profile?.userId ? <MhdApprovalCenter userId={profile.userId} /> : <p className="text-sm text-muted-foreground">No current user profile loaded.</p>}
      </MhdCard>
    </div>
  );
}
