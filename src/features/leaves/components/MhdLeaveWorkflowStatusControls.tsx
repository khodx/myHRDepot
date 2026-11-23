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
import { MhdLeaveActionButtons, MhdLeaveActionModal } from './MhdLeaveActionModal';
import { useMhdLeaveDraftField } from './mhdLeaveActionContext';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const label = (value: string) => value.replaceAll('_', ' ');

interface StatusControlScope {
  caseId: string;
  companyId: string | null;
  isPending: boolean;
}

/** A Change Status button that opens the segment status form; nothing for a terminal segment. */
export function MhdLeaveSegmentStatusControl({
  caseId,
  companyId,
  segment,
  isPending,
  onSubmit,
}: StatusControlScope & {
  segment: MhdLeaveWorkflow['segments'][number];
  onSubmit: (input: MhdLeaveSegmentStatusInput) => Promise<unknown>;
}) {
  const nextStatuses =
    MHD_LEAVE_SEGMENT_STATUS_TRANSITIONS[segment.status as MhdLeaveSegmentStatus] ?? [];
  if (nextStatuses.length === 0) return null;
  return (
    <div className="mt-3">
      <MhdLeaveActionModal
        caseId={caseId}
        action={`segment-status:${segment.id}`}
        companyId={companyId}
        title="Change Segment Status"
        size="md"
        launchLabel="Change Status"
      >
        <SegmentStatusForm
          segment={segment}
          nextStatuses={nextStatuses}
          isPending={isPending}
          onSubmit={onSubmit}
        />
      </MhdLeaveActionModal>
    </div>
  );
}

function SegmentStatusForm({
  segment,
  nextStatuses,
  isPending,
  onSubmit,
}: {
  segment: MhdLeaveWorkflow['segments'][number];
  nextStatuses: readonly MhdLeaveSegmentStatus[];
  isPending: boolean;
  onSubmit: (input: MhdLeaveSegmentStatusInput) => Promise<unknown>;
}) {
  const currentStatus = segment.status as MhdLeaveSegmentStatus;
  const recordedHours = String(segment.actual_hours ?? segment.planned_hours);
  const [status, setStatus] = useMhdLeaveDraftField<MhdLeaveSegmentStatus>(
    'status',
    nextStatuses[0],
  );
  const [actualHours, setActualHours] = useMhdLeaveDraftField('actualHours', recordedHours);
  const selectedStatus = nextStatuses.includes(status) ? status : nextStatuses[0];

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="text-xs">
          New status
          <select
            className={`mt-1 ${inputClass}`}
            value={selectedStatus}
            onChange={(e) => {
              const next = e.target.value as MhdLeaveSegmentStatus;
              setStatus(next);
              if (next === 'TAKEN') setActualHours(recordedHours);
            }}
          >
            {nextStatuses.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
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
            <p className="text-xs text-muted-foreground">
              Marking a segment taken debits the leave balance.
            </p>
          </>
        ) : null}
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Update Status"
        disabled={isPending || (selectedStatus === 'TAKEN' && !actualHours.trim())}
        onSubmit={() =>
          onSubmit({
            segmentId: segment.id,
            currentStatus,
            status: selectedStatus,
            ...(selectedStatus === 'TAKEN' ? { actualHours: Number(actualHours) } : {}),
          })
        }
      />
    </div>
  );
}

/** A Change Status button that opens the obligation status form; nothing for a terminal one. */
export function MhdLeaveBenefitObligationStatusControl({
  caseId,
  companyId,
  obligation,
  isPending,
  onSubmit,
}: StatusControlScope & {
  obligation: MhdLeaveWorkflow['benefits'][number];
  onSubmit: (input: MhdLeaveBenefitObligationStatusInput) => Promise<unknown>;
}) {
  const nextStatuses =
    MHD_LEAVE_BENEFIT_OBLIGATION_STATUS_TRANSITIONS[
      obligation.status as MhdLeaveBenefitObligationStatus
    ] ?? [];
  if (nextStatuses.length === 0) return null;
  return (
    <div className="mt-3">
      <MhdLeaveActionModal
        caseId={caseId}
        action={`obligation-status:${obligation.id}`}
        companyId={companyId}
        title="Change Obligation Status"
        size="md"
        launchLabel="Change Status"
      >
        <ObligationStatusForm
          obligation={obligation}
          nextStatuses={nextStatuses}
          isPending={isPending}
          onSubmit={onSubmit}
        />
      </MhdLeaveActionModal>
    </div>
  );
}

function ObligationStatusForm({
  obligation,
  nextStatuses,
  isPending,
  onSubmit,
}: {
  obligation: MhdLeaveWorkflow['benefits'][number];
  nextStatuses: readonly MhdLeaveBenefitObligationStatus[];
  isPending: boolean;
  onSubmit: (input: MhdLeaveBenefitObligationStatusInput) => Promise<unknown>;
}) {
  const currentStatus = obligation.status as MhdLeaveBenefitObligationStatus;
  const [status, setStatus] = useMhdLeaveDraftField<MhdLeaveBenefitObligationStatus>(
    'status',
    nextStatuses[0],
  );
  const [reason, setReason] = useMhdLeaveDraftField('reason', '');
  const selectedStatus = nextStatuses.includes(status) ? status : nextStatuses[0];

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="text-xs">
          New status
          <select
            className={`mt-1 ${inputClass}`}
            value={selectedStatus}
            onChange={(e) => setStatus(e.target.value as MhdLeaveBenefitObligationStatus)}
          >
            {nextStatuses.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </label>
        {selectedStatus === 'WAIVED' ? (
          <label className="text-xs">
            Reason
            <input
              className={`mt-1 ${inputClass}`}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        ) : null}
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Update Status"
        disabled={isPending || (selectedStatus === 'WAIVED' && !reason.trim())}
        onSubmit={() =>
          onSubmit({
            obligationId: obligation.id,
            currentStatus,
            status: selectedStatus,
            ...(selectedStatus === 'WAIVED' ? { reason } : {}),
          })
        }
      />
    </div>
  );
}
