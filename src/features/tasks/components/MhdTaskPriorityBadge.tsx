interface MhdTaskPriorityBadgeProps {
  priorityName: string | null;
  colorToken: string | null;
}

const PRIORITY_CLASS_BY_TOKEN: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

export function MhdTaskPriorityBadge({ priorityName, colorToken }: MhdTaskPriorityBadgeProps) {
  if (!priorityName) return <span className="text-xs text-slate-400">No priority</span>;
  const className = PRIORITY_CLASS_BY_TOKEN[colorToken ?? 'slate'] ?? PRIORITY_CLASS_BY_TOKEN.slate;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${className}`}
    >
      {priorityName}
    </span>
  );
}
