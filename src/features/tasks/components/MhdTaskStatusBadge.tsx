interface MhdTaskStatusBadgeProps {
  statusName: string;
  colorToken: string | null;
}

const STATUS_CLASS_BY_TOKEN: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

export function MhdTaskStatusBadge({ statusName, colorToken }: MhdTaskStatusBadgeProps) {
  const className = STATUS_CLASS_BY_TOKEN[colorToken ?? 'slate'] ?? STATUS_CLASS_BY_TOKEN.slate;
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${className}`}
    >
      {statusName}
    </span>
  );
}
