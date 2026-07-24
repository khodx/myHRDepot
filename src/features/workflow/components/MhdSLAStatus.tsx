import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { mhdWorkflowService } from '../Service';
import type { MhdWorkflowSLAStatus } from '../Types';

export interface MhdSLAStatusProps {
  taskId: string;
  className?: string;
}

export function MhdSLAStatus({ taskId, className = '' }: MhdSLAStatusProps) {
  const [slaStatus, setSlaStatus] = useState<MhdWorkflowSLAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSla() {
      try {
        const data = await mhdWorkflowService.checkSLA(taskId);
        if (!cancelled) {
          setSlaStatus(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to check SLA');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSla();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (isLoading) {
    return <div className={`text-sm text-muted-foreground ${className}`}>—</div>;
  }

  if (error || !slaStatus) {
    return <div className={`text-xs text-red-600 ${className}`}>SLA Error</div>;
  }

  const statusConfig = {
    ON_TRACK: {
      icon: CheckCircle2,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      label: 'On Track',
    },
    AT_RISK: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      label: 'At Risk',
    },
    OVERDUE: {
      icon: AlertCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      label: 'Overdue',
    },
  } satisfies Record<
    MhdWorkflowSLAStatus['slaStatus'],
    { icon: typeof CheckCircle2; bg: string; border: string; text: string; label: string }
  >;

  const config = statusConfig[slaStatus.slaStatus];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} rounded-lg border px-3 py-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.text}`} />
        <div>
          <p className={`text-xs font-semibold ${config.text}`}>{config.label}</p>
          <p className={`text-xs ${config.text}`}>
            Due {slaStatus.slaDueDate} ({slaStatus.daysUntilDue} days)
          </p>
        </div>
      </div>
    </div>
  );
}
