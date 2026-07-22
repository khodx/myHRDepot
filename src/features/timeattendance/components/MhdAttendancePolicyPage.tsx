import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mhdCanMutateAttendance } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdAttendancePolicy, useMhdCreatePolicyVersion } from '../Hook';
import type { MhdAttendancePolicyFormValues } from '../Schemas';
import { MhdAttendancePolicyEditor } from './MhdAttendancePolicyEditor';

/**
 * `/attendance/policy` route entry.
 *
 * Privileged only (Platform Admin / HR Partner / Client Admin) — the router
 * guard rejects Client User and Viewer, and this component mirrors that with a
 * defensive read-only fallback should it ever render for a non-privileged
 * caller.
 *
 * Publishing does not edit the current policy — it closes that version and opens
 * a new one, so historical ledger rows stay explicable under the rule that
 * produced them.
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
        <p className="text-sm text-neutral-500">Loading policy…</p>
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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Attendance policy</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Point values, roll-off window and the escalation ladder.
          </p>
        </div>
        <Link to="/attendance" className="text-sm text-blue-700 hover:underline">
          Back to Attendance
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {policy.isLoading ? (
        <p className="text-sm text-neutral-500">Loading current policy…</p>
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
