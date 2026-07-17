import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdApprovalCenter } from './MhdApprovalCenter';

export function MhdApprovalsPage() {
  const { profile } = useMhdAuth();

  return (
    <main className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">My HR Depot</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Approvals</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Review approvals assigned to you and act on the current level through the live `0019000` Approval Engine RPC surface.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {profile?.userId ? <MhdApprovalCenter userId={profile.userId} /> : <p className="text-sm text-slate-500">No current user profile loaded.</p>}
        </div>
      </div>
    </main>
  );
}
