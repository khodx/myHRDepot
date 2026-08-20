import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAcknowledgePolicy, useMhdMyPolicyAcknowledgments } from '../Hook';
import { mhdFormatPolicyValue, type MhdMyPolicyAcknowledgment } from '../Types';

export function MhdMyPoliciesPage() {
  const acknowledgments = useMhdMyPolicyAcknowledgments();
  const pending = (acknowledgments.data ?? []).filter((item) => item.status === 'PENDING');
  const signed = (acknowledgments.data ?? []).filter((item) => item.status === 'SIGNED');

  return (
    <div className="space-y-6">
      <MhdPageHeader title="My Policies" description="Policies assigned to you for acknowledgment." />
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Pending</h2>
        {acknowledgments.isLoading ? <p className="text-sm text-muted-foreground">Loading policies...</p> : pending.length === 0 ? <p className="text-sm text-muted-foreground">You have no pending policy acknowledgments.</p> : <ul className="space-y-3">{pending.map((item) => <MhdMyPolicyRow key={item.id} item={item} />)}</ul>}
      </section>
      {signed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Signed</h2>
          <ul className="space-y-2">
            {signed.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
                <div><p className="text-sm font-medium">{item.policyTitle}</p><p className="font-mono text-xs text-muted-foreground">{item.referenceId}</p></div>
                <MhdBadge variant="success">{mhdFormatPolicyValue(item.status)}</MhdBadge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function MhdMyPolicyRow({ item }: { item: MhdMyPolicyAcknowledgment }) {
  const acknowledge = useMhdAcknowledgePolicy();
  const [confirmed, setConfirmed] = useState(false);

  async function handleAcknowledge() {
    if (!confirmed) return;
    // E-signature request creation for Policies is a documented follow-up; this shell path records a direct acknowledgment through the provided RPC.
    await acknowledge.mutateAsync({ acknowledgmentId: item.id, esignatureRequestId: null });
  }

  return (
    <li>
      <MhdCard className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{item.policyTitle}</p>
            <p className="font-mono text-xs text-muted-foreground">{item.referenceId}</p>
          </div>
          <MhdBadge variant="warning">{mhdFormatPolicyValue(item.status)}</MhdBadge>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          I acknowledge this policy.
        </label>
        {acknowledge.error instanceof Error ? <p className="text-xs text-rose-600">{acknowledge.error.message}</p> : null}
        <Button disabled={!confirmed || acknowledge.isPending} onClick={() => void handleAcknowledge()}>
          {acknowledge.isPending ? 'Recording...' : 'Acknowledge'}
        </Button>
      </MhdCard>
    </li>
  );
}
