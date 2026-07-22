import { RefreshCw } from 'lucide-react'
import { useMhdDashboard } from '../Hook'
import { MhdDashboardKpiCard } from './MhdDashboardKpiCard'
import { MhdDashboardMyTasks } from './MhdDashboardMyTasks'
import { MhdDashboardActivity } from './MhdDashboardActivity'

export function MhdDashboardPage() {
  const {
    isLoading,
    error,
    taskSummary,
    myTasks,
    recentActivity,
    lastRefreshed,
    refetch,
  } = useMhdDashboard()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading dashboard…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <button
          type="button"
          onClick={refetch}
          title="Refresh dashboard"
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {lastRefreshed
            ? `Updated ${lastRefreshed.toLocaleTimeString()}`
            : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards */}
      {taskSummary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MhdDashboardKpiCard
            label="Total Tasks"
            value={taskSummary.totalTasks}
          />
          <MhdDashboardKpiCard
            label="In Progress"
            value={taskSummary.inProgress}
            colorClass="text-blue-600"
          />
          <MhdDashboardKpiCard
            label="Overdue"
            value={taskSummary.overdueCount}
            colorClass={taskSummary.overdueCount > 0 ? 'text-red-600' : 'text-neutral-900'}
          />
          <MhdDashboardKpiCard
            label="Completion Rate"
            value={`${taskSummary.completionRate.toFixed(1)}%`}
            subValue={`${taskSummary.completed} of ${taskSummary.totalTasks} completed`}
            colorClass="text-green-600"
          />
        </div>
      )}

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">My Tasks</h2>
          <MhdDashboardMyTasks tasks={myTasks} />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">Recent Activity</h2>
          <MhdDashboardActivity items={recentActivity} />
        </div>
      </div>
    </div>
  )
}
