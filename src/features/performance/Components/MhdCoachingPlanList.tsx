import { ListChecks, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
      <MhdCard className="border-dashed">
        <MhdEmptyState
          icon={Target}
          title="No coaching plans found"
          description="No coaching plans match the current filters."
        />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Plan</MhdTh>
            <MhdTh>Person</MhdTh>
            <MhdTh>Coach</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Checkpoints</MhdTh>
            <MhdTh>Target</MhdTh>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <MhdTr key={plan.id}>
              <MhdTd>
                <Link
                  to={`/performance/coaching/${plan.id}`}
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  {plan.title}
                </Link>
                <div className="text-xs text-muted-foreground">{plan.referenceId}</div>
              </MhdTd>
              <MhdTd>{plan.personDisplayName ?? '—'}</MhdTd>
              <MhdTd>{plan.coachDisplayName ?? '—'}</MhdTd>
              <MhdTd>
                <MhdCoachingStatusBadge status={plan.status} />
              </MhdTd>
              <MhdTd>
                {plan.itemTotalCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    {plan.itemDoneCount} / {plan.itemTotalCount}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </MhdTd>
              <MhdTd className="text-muted-foreground">{formatDate(plan.targetDate)}</MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
