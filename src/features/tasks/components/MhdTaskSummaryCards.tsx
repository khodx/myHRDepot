interface MhdTaskSummaryCardsProps {
  summary: {
    total: number;
    overdue: number;
    completed: number;
    unassigned: number;
  };
}

export function MhdTaskSummaryCards({ summary }: MhdTaskSummaryCardsProps) {
  const cards = [
    { label: 'Total Tasks', value: summary.total },
    { label: 'Overdue', value: summary.overdue },
    { label: 'Completed', value: summary.completed },
    { label: 'Unassigned', value: summary.unassigned },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-slate-200 bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500">{card.label}</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{card.value}</div>
        </div>
      ))}
    </section>
  );
}
