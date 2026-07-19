import { ListChecks, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MhdCoachingPlan } from '../Types';
import { MhdCoachingStatusBadge } from './MhdCoachingStatusBadge';

interface Props {
  plans: MhdCoachingPlan[];
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

export function MhdCoachingPlanList({ plans }: Props) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
        <Target className="mb-2 h-8 w-8" />
        <p className="text-sm">No coaching plans match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2 pr-4">Plan</th>
            <th className="py-2 pr-4">Person</th>
            <th className="py-2 pr-4">Coach</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Checkpoints</th>
            <th className="py-2 pr-4">Target</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-b last:border-0 hover:bg-neutral-50">
              <td className="py-2 pr-4">
                <Link to={`/performance/coaching/${plan.id}`} className="font-medium hover:underline">
                  {plan.title}
                </Link>
                <div className="text-xs text-neutral-400">{plan.referenceId}</div>
              </td>
              <td className="py-2 pr-4">{plan.personDisplayName ?? '—'}</td>
              <td className="py-2 pr-4">{plan.coachDisplayName ?? '—'}</td>
              <td className="py-2 pr-4">
                <MhdCoachingStatusBadge status={plan.status} />
              </td>
              <td className="py-2 pr-4">
                {plan.itemTotalCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-neutral-600">
                    <ListChecks className="h-4 w-4 text-neutral-400" />
                    {plan.itemDoneCount} / {plan.itemTotalCount}
                  </span>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </td>
              <td className="py-2 pr-4 text-neutral-600">{formatDate(plan.targetDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
