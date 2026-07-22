import { useState } from 'react';
import { mhdApprovalService } from '../Service';
import type { MhdApprovalChainMode, MhdApprovalEntityType, MhdApprovalType } from '@/types/approval';

export interface MhdApprovalRequestApproverOption {
  id: string;
  displayName: string;
}

export interface MhdApprovalRequestProps {
  companyId: string;
  entityType: MhdApprovalEntityType;
  entityId: string;
  taskId?: string;
  approverOptions: MhdApprovalRequestApproverOption[];
  approvalType?: MhdApprovalType;
  onSuccess: () => void;
}

export function MhdApprovalRequest({
  companyId,
  entityType,
  entityId,
  taskId,
  approverOptions,
  approvalType = 'APPROVAL_REQUIRED',
  onSuccess,
}: MhdApprovalRequestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [approverIds, setApproverIds] = useState<string[]>([]);
  const [chainMode, setChainMode] = useState<MhdApprovalChainMode>('SEQUENTIAL');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleApprover(approverId: string) {
    setApproverIds((current) =>
      current.includes(approverId) ? current.filter((id) => id !== approverId) : [...current, approverId],
    );
  }

  async function handleSubmit() {
    if (approverIds.length === 0) {
      setError('Select at least one approver.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await mhdApprovalService.createApprovalRequest({
        companyId,
        taskId,
        entityType,
        entityId,
        approvalType,
        chainMode,
        approverIds,
        reason: reason.trim() ? reason.trim() : undefined,
      });

      setIsOpen(false);
      setApproverIds([]);
      setReason('');
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen((open) => !open)} className="rounded bg-blue-600 px-4 py-2 text-white">
        Request Approval
      </button>
      {isOpen ? (
        <div className="mt-2 space-y-3 rounded border bg-card p-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div>
            <p className="mb-1 text-sm font-medium">Approvers</p>
            <div className="space-y-1">
              {approverOptions.length === 0 ? <p className="text-sm text-gray-500">No eligible approvers found.</p> : null}
              {approverOptions.map((option) => (
                <label key={option.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={approverIds.includes(option.id)} onChange={() => toggleApprover(option.id)} />
                  {option.displayName}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Chain type</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="chainMode" checked={chainMode === 'SEQUENTIAL'} onChange={() => setChainMode('SEQUENTIAL')} />
              Sequential (approve in order)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="chainMode" checked={chainMode === 'PARALLEL'} onChange={() => setChainMode('PARALLEL')} />
              Parallel (all must approve)
            </label>
          </div>

          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason for approval"
            className="w-full rounded border p-2"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading || approverIds.length === 0}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isLoading ? 'Submitting...' : 'Submit Approval Request'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
