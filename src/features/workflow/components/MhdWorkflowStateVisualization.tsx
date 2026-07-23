import { ArrowRight } from 'lucide-react';
import type { MhdWorkflowAvailableTransition } from '../Types';

export interface MhdWorkflowStateVisualizationProps {
  currentStatusName: string;
  availableTransitions: MhdWorkflowAvailableTransition[];
  className?: string;
}

const STATUS_COLOR_FALLBACK = 'bg-muted';

export function MhdWorkflowStateVisualization({
  currentStatusName,
  availableTransitions,
  className = '',
}: MhdWorkflowStateVisualizationProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold text-foreground">Workflow State</h3>

      <div className="flex flex-wrap items-center gap-4">
        <div className={`${STATUS_COLOR_FALLBACK} rounded-lg px-4 py-2 font-semibold`}>{currentStatusName}</div>

        {availableTransitions.length > 0 ? (
          <>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {availableTransitions.map((transition) => (
                <div
                  key={transition.statusId}
                  className={`${transition.colorToken || STATUS_COLOR_FALLBACK} rounded-lg px-4 py-2 font-semibold opacity-70`}
                >
                  {transition.statusName}
                </div>
              ))}
            </div>
          </>
        ) : (
          <span className="text-sm italic text-muted-foreground">(No more transitions available)</span>
        )}
      </div>
    </div>
  );
}
