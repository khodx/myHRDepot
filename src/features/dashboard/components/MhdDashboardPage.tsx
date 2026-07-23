import { AlertTriangle, ListChecks, Loader, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard'
import { MhdPageHeader } from '@/components/ui/MhdPageHeader'
import { MhdStatCard } from '@/components/ui/MhdStatCard'
import { useMhdDashboard } from '../Hook'
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
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="secondary" onClick={refetch}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Dashboard"
        description="Get a real-time overview of your HR operations and key metrics."
        actions={
          <button
            type="button"
            onClick={refetch}
            title="Refresh dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {lastRefreshed
              ? `Updated ${lastRefreshed.toLocaleTimeString()}`
              : 'Refresh'}
          </button>
        }
      />

      {taskSummary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MhdStatCard icon={ListChecks} label="Total Tasks" value={taskSummary.totalTasks} />
          <MhdStatCard icon={Loader} label="In Progress" value={taskSummary.inProgress} />
          <MhdStatCard icon={AlertTriangle} label="Overdue" value={taskSummary.overdueCount} />
          <MhdStatCard
            icon={TrendingUp}
            label="Completion Rate"
            value={`${taskSummary.completionRate.toFixed(1)}%`}
            hint={`${taskSummary.completed} of ${taskSummary.totalTasks} completed`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MhdCard>
          <MhdCardHeader title="My Tasks" />
          <MhdDashboardMyTasks tasks={myTasks} />
        </MhdCard>

        <MhdCard>
          <MhdCardHeader title="Recent Activity" />
          <MhdDashboardActivity items={recentActivity} />
        </MhdCard>
      </div>
    </div>
  )
}
