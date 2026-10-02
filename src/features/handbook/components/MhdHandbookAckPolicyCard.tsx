import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { useMhdSetHandbookAckPolicy } from '../Hook';
import {
  MHD_HANDBOOK_ACK_DUE_DAYS_MAX,
  MHD_HANDBOOK_ACK_DUE_DAYS_MIN,
  type MhdHandbook,
} from '../Types';

interface Props {
  handbook: MhdHandbook;
  /** Governs the edit affordance. The RPC re-checks the administrator role regardless. */
  canManage: boolean;
}

/**
 * How employees acknowledge this handbook.
 *
 * - **Deadline.** How long an employee has once a version is assigned to them. It is
 *   stamped on each acknowledgment when it is assigned, so a change applies to FUTURE
 *   assignments only; one already assigned keeps the deadline it was given. Overdue ones
 *   raise the HANDBOOK_ACKNOWLEDGMENT_OVERDUE automation event, which an administrator
 *   can turn into a reminder.
 * - **Signature.** When required, an employee cannot acknowledge until they have signed a
 *   short receipt for the exact version (an administrator sends the request from the
 *   Acknowledgments tab). An administrator can still record an in-person acknowledgment.
 */
export function MhdHandbookAckPolicyCard({ handbook, canManage }: Props) {
  const setPolicy = useMhdSetHandbookAckPolicy();
  const [days, setDays] = useState(String(handbook.acknowledgmentDueDays));
  const [requiresSignature, setRequiresSignature] = useState(handbook.requiresSignature);

  const parsed = Number(days);
  const isValid =
    days.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= MHD_HANDBOOK_ACK_DUE_DAYS_MIN &&
    parsed <= MHD_HANDBOOK_ACK_DUE_DAYS_MAX;
  const isUnchanged =
    parsed === handbook.acknowledgmentDueDays && requiresSignature === handbook.requiresSignature;

  return (
    <MhdCard className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="ackDueDays" className="block text-sm font-medium text-foreground">
          Acknowledgment deadline (days)
        </label>
        <input
          id="ackDueDays"
          type="number"
          min={MHD_HANDBOOK_ACK_DUE_DAYS_MIN}
          max={MHD_HANDBOOK_ACK_DUE_DAYS_MAX}
          value={days}
          onChange={(event) => setDays(event.target.value)}
          disabled={!canManage || setPolicy.isPending}
          className="w-28 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          Employees have this long to acknowledge a version once it is assigned to them. A change
          applies to future assignments only.
        </p>
        {!isValid ? (
          <p className="text-xs text-rose-600">
            Enter a whole number of days from {MHD_HANDBOOK_ACK_DUE_DAYS_MIN} to{' '}
            {MHD_HANDBOOK_ACK_DUE_DAYS_MAX}.
          </p>
        ) : null}
      </div>

      <label className="flex items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={requiresSignature}
          onChange={(event) => setRequiresSignature(event.target.checked)}
          disabled={!canManage || setPolicy.isPending}
          className="mt-0.5 h-4 w-4 rounded border-border disabled:opacity-60"
        />
        <span>
          Require a signature to acknowledge
          <span className="block text-xs text-muted-foreground">
            Employees sign a short receipt for the exact version, from an emailed link. HR can still
            record an in-person acknowledgment.
          </span>
        </span>
      </label>

      {canManage ? (
        <Button
          variant="secondary"
          className="py-1.5"
          disabled={!isValid || isUnchanged || setPolicy.isPending}
          onClick={() =>
            void setPolicy.mutateAsync({
              handbookId: handbook.id,
              dueDays: parsed,
              requiresSignature,
            })
          }
        >
          {setPolicy.isPending ? 'Saving…' : 'Save Policy'}
        </Button>
      ) : null}
      {setPolicy.isError ? (
        <p className="text-xs text-rose-600" role="alert">
          {setPolicy.error instanceof Error
            ? setPolicy.error.message
            : 'Could not save the policy.'}
        </p>
      ) : null}
    </MhdCard>
  );
}
