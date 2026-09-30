import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import {
  MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS,
  MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS,
  type MhdLeaveBenefitObligationStatusInput,
  type MhdLeaveSegmentStatusInput,
  type MhdLeaveWorkflow,
  type MhdLeaveSegmentStatus,
  type MhdLeaveBenefitObligationStatus,
} from '../WorkflowTypes';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const label = (value: string) => value.replaceAll('_', ' ');

export function MhdLeaveSegmentStatusControl({
  segment,
  isPending,
  onSubmit,
}: {
  segment: MhdLeaveWorkflow['segments'][number];
  isPending: boolean;
  onSubmit: (input: MhdLeaveSegmentStatusInput) => Promise<boolean>;
}) {
  const currentStatus = segment.status as MhdLeaveSegmentStatus;
  const nextStatuses = MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS[currentStatus] ?? [];
  const [status, setStatus] = useState<MhdLeaveSegmentStatus>(nextStatuses[0] ?? currentStatus);
  const [actualHours, setActualHours] = useState(String(segment.actual_hours ?? segment.planned_hours));
  if (nextStatuses.length === 0) return null;
  const selectedStatus = nextStatuses.includes(status) ? status : nextStatuses[0];

  async function submit() {
    const saved = await onSubmit({
      segmentId: segment.id,
      currentStatus,
      status: selectedStatus,
      ...(selectedStatus === 'TAKEN' ? { actualHours: Number(actualHours) } : {}),
    });
    if (saved) setActualHours('');
  }

  return (
    <MhdCard className="mt-3 space-y-3">
      <MhdCardHeader title="Change segment status" />
      <MhdFormFieldStack>
        <label className="text-xs">
          New status
          <select className={`mt-1 ${inputClass}`} value={selectedStatus} onChange={(e) => {
            const next = e.target.value as MhdLeaveSegmentStatus;
            setStatus(next);
            if (next === 'TAKEN') setActualHours(String(segment.actual_hours ?? segment.planned_hours));
          }}>
            {nextStatuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        {selectedStatus === 'TAKEN' ? (
          <>
            <label className="text-xs">
              Actual Hours
              <input
                className={`mt-1 ${inputClass}`}
                type="number"
                min="0"
                step="any"
                required
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
              />
            </label>
            <p className="text-xs text-muted-foreground">Marking a segment taken debits the leave balance.</p>
          </>
        ) : null}
      </MhdFormFieldStack>
      <Button disabled={isPending || (selectedStatus === 'TAKEN' && !actualHours.trim())} onClick={() => void submit()}>
        Update Status
      </Button>
    </MhdCard>
  );
}

export function MhdLeaveBenefitObligationStatusControl({
  obligation,
  isPending,
  onSubmit,
}: {
  obligation: MhdLeaveWorkflow['benefits'][number];
  isPending: boolean;
  onSubmit: (input: MhdLeaveBenefitObligationStatusInput) => Promise<boolean>;
}) {
  const currentStatus = obligation.status as MhdLeaveBenefitObligationStatus;
  const nextStatuses = MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS[currentStatus] ?? [];
  const [status, setStatus] = useState<MhdLeaveBenefitObligationStatus>(nextStatuses[0] ?? currentStatus);
  const [reason, setReason] = useState('');
  if (nextStatuses.length === 0) return null;
  const selectedStatus = nextStatuses.includes(status) ? status : nextStatuses[0];

  async function submit() {
    const saved = await onSubmit({
      obligationId: obligation.id,
      currentStatus,
      status: selectedStatus,
      ...(selectedStatus === 'WAIVED' ? { reason } : {}),
    });
    if (saved) setReason('');
  }

  return (
    <MhdCard className="mt-3 space-y-3">
      <MhdCardHeader title="Change obligation status" />
      <MhdFormFieldStack>
        <label className="text-xs">
          New status
          <select className={`mt-1 ${inputClass}`} value={selectedStatus} onChange={(e) => setStatus(e.target.value as MhdLeaveBenefitObligationStatus)}>
            {nextStatuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </label>
        {selectedStatus === 'WAIVED' ? (
          <label className="text-xs">
            Reason
            <input className={`mt-1 ${inputClass}`} required value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        ) : null}
      </MhdFormFieldStack>
      <Button disabled={isPending || (selectedStatus === 'WAIVED' && !reason.trim())} onClick={() => void submit()}>
        Update Status
      </Button>
    </MhdCard>
  );
}
