import { useState } from 'react';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { mhdWorkflowService } from '../Service';
import type { MhdTransitionTaskInput, MhdWorkflowAvailableTransition } from '../Types';

export interface MhdStatusTransitionButtonProps {
  taskId: string;
  currentStatusId: string;
  currentStatusName: string;
  onTransitionSuccess: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const TERMINAL_STATUS_NAMES = new Set(['Completed', 'Cancelled']);

export function MhdStatusTransitionButton({
  taskId,
  currentStatusName,
  onTransitionSuccess,
  disabled = false,
  className = '',
}: MhdStatusTransitionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTransitions, setAvailableTransitions] = useState<MhdWorkflowAvailableTransition[]>([]);

  const isTerminal = TERMINAL_STATUS_NAMES.has(currentStatusName);

  async function handleOpenDropdown() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const available = await mhdWorkflowService.getAvailableTransitions(taskId);
      setAvailableTransitions(available);
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transitions');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTransition(toStatusId: string) {
    setIsLoading(true);
    setError(null);

    try {
      const input: MhdTransitionTaskInput = {
        taskId,
        toStatusId,
        reason: undefined,
      };

      await mhdWorkflowService.transitionTask(input);
      setIsOpen(false);
      await onTransitionSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transition failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => void handleOpenDropdown()}
        disabled={disabled || isTerminal || isLoading}
        className={`flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors ${
          isTerminal
            ? 'cursor-not-allowed bg-muted text-muted-foreground'
            : 'bg-accent-tint text-accent-hover hover:opacity-80 disabled:opacity-50'
        }`}
      >
        <span>{currentStatusName}</span>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {error ? (
        <div className="absolute left-0 top-full z-50 mt-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {isOpen && !isTerminal ? (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-max rounded-md border border-border bg-card shadow-lg">
          {availableTransitions.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">No transitions available</div>
          ) : (
            availableTransitions.map((transition) => (
              <button
                key={transition.statusId}
                type="button"
                onClick={() => void handleTransition(transition.statusId)}
                disabled={isLoading}
                className="block w-full px-4 py-2 text-left hover:bg-muted disabled:opacity-50"
              >
                {transition.statusName}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
