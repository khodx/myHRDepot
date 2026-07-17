import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { mhdWorkflowService } from '../Service';
import type { MhdWorkflowTransition } from '../Types';

export interface MhdWorkflowTransitionHistoryProps {
  taskId: string;
  className?: string;
}

export function MhdWorkflowTransitionHistory({ taskId, className = '' }: MhdWorkflowTransitionHistoryProps) {
  const [transitions, setTransitions] = useState<MhdWorkflowTransition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTransitions() {
      try {
        const data = await mhdWorkflowService.getTransitionHistory(taskId);
        if (!cancelled) {
          setTransitions(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTransitions();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (isLoading) {
    return <div className={`text-sm text-gray-500 ${className}`}>Loading transition history...</div>;
  }

  if (error) {
    return <div className={`text-sm text-red-600 ${className}`}>{error}</div>;
  }

  if (transitions.length === 0) {
    return <div className={`text-sm text-gray-500 ${className}`}>No transitions yet</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold text-gray-900">Status History</h3>
      <div className="relative">
        <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {transitions.map((transition) => (
            <div key={transition.id} className="relative pl-12">
              <div className="absolute left-0 top-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      transition.fromStatusColor || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {transition.fromStatusName}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      transition.toStatusColor || 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {transition.toStatusName}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-600">
                  {transition.createdByName} on {format(new Date(transition.createdAt), 'MMM d, yyyy h:mm a')}
                </p>

                {transition.reason ? (
                  <p className="mt-2 text-sm italic text-gray-700">"{transition.reason}"</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
