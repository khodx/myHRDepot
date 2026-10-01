import { useState } from 'react';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdCanMutateAttendance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAttendancePolicy, useMhdCreatePolicyVersion } from '../Hook';
import type { MhdAttendancePolicyFormValues } from '../Schemas';
import { MhdAttendancePolicyEditor } from './MhdAttendancePolicyEditor';

/**
 * `/attendance/policy` route entry.
 *
 * Readable by everyone who can open /attendance: the point values, roll-off window and
 * escalation ladder are published to employees on purpose - knowing what an absence
 * costs is the point of a published attendance policy. Only the privileged set may
 * publish a new version; everyone else gets the editor in read-only mode (and the
 * server would refuse a write regardless).
 *
 * Publishing does not edit the current policy - it closes that version and opens a
 * new one, so historical ledger rows stay explicable under the rule that produced them.
 */
export function MhdAttendancePolicyPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const canMutate = mhdCanMutateAttendance(roles);

  const [error, setError] = useState<string | null>(null);
  const policy = useMhdAttendancePolicy(companyId);
  const createVersion = useMhdCreatePolicyVersion(companyId);

  if (!companyId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading policy…</p>
      </div>
    );
  }

  async function handleSubmit(values: MhdAttendancePolicyFormValues) {
    setError(null);
    try {
      await createVersion.mutateAsync({
        companyId: values.companyId,
        policyName: values.policyName,
        effectiveFrom: values.effectiveFrom,
        rollOffMonths: values.rollOffMonths,
        excusedUnpaidAccrues: values.excusedUnpaidAccrues,
        excusedPaidAccrues: values.excusedPaidAccrues,
        pointRules: values.pointRules,
        thresholds: values.thresholds,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to publish the policy version.');
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/attendance"
        backLabel="Attendance"
        title="Attendance Policy"
        description="Point values, roll-off window and the escalation ladder."
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {policy.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading current policy…</p>
      ) : (
        <MhdAttendancePolicyEditor
          companyId={companyId}
          current={policy.data ?? null}
          onSubmit={handleSubmit}
          onCancel={() => setError(null)}
          isSubmitting={createVersion.isPending}
          readOnly={!canMutate}
        />
      )}
    </div>
  );
}
