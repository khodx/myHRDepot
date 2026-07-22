import { clsx } from 'clsx'

interface Props {
  label: string
  value: number | string
  subValue?: string
  colorClass?: string
}

export function MhdDashboardKpiCard({
  label,
  value,
  subValue,
  colorClass = 'text-neutral-900',
}: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={clsx('mt-1 text-3xl font-bold tabular-nums', colorClass)}>{value}</p>
      {subValue && <p className="mt-0.5 text-xs text-neutral-400">{subValue}</p>}
    </div>
  )
}
