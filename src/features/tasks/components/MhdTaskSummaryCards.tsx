import { AlertTriangle, CheckCircle2, ListChecks, UserX } from 'lucide-react';
import { MhdStatCard } from '@/components/ui/MhdStatCard';

interface MhdTaskSummaryCardsProps {
  summary: {
    total: number;
    overdue: number;
    completed: number;
    unassigned: number;
  };
}

export function MhdTaskSummaryCards({ summary }: MhdTaskSummaryCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MhdStatCard icon={ListChecks} label="Total Tasks" value={summary.total} />
      <MhdStatCard icon={AlertTriangle} label="Overdue" value={summary.overdue} />
      <MhdStatCard icon={CheckCircle2} label="Completed" value={summary.completed} />
      <MhdStatCard icon={UserX} label="Unassigned" value={summary.unassigned} />
    </section>
  );
}
