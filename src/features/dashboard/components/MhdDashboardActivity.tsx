import { Activity } from 'lucide-react'
import type { MhdDashboardActivityItem } from '../Types'

interface Props {
  items: MhdDashboardActivityItem[]
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function MhdDashboardActivity({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="flex items-center justify-center py-8 text-sm text-neutral-400">
        No recent activity
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.eventId} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
            <Activity className="h-3 w-3 text-neutral-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-neutral-700">{item.summary}</p>
            <p className="text-xs text-neutral-400">
              {item.performedBy} · {timeAgo(item.performedAt)}
            </p>
          </div>
          {item.referenceId && (
            <span className="shrink-0 text-xs text-neutral-400">{item.referenceId}</span>
          )}
        </div>
      ))}
    </div>
  )
}
