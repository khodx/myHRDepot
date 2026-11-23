import { useState } from 'react';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdValidateLeavePaySource } from '../WorkflowValidation';
import {
  MHD_LEAVE_PAY_SOURCE_KEYS,
  MHD_LEAVE_PAY_SOURCE_STATUSES,
  type MhdLeavePaySource,
  type MhdLeavePaySourceInput,
  type MhdLeavePaySourceKey,
  type MhdLeavePaySourceStatus,
  type MhdLeavePaySourceStatusInput,
  type MhdLeavePaySourceWarning,
} from '../WorkflowTypes';
import { MhdLeaveActionButtons, MhdLeaveActionModal } from './MhdLeaveActionModal';
import { useMhdLeaveDraftField } from './mhdLeaveActionContext';
import {
  MHD_LEAVE_PAY_SOURCE_WARNING_MESSAGES,
  mhdLeaveEnumLabel,
  mhdLeavePick,
} from './mhdLeaveLabels';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** A pay source in one of these states is closed; the RPC accepts no further change. */
const TERMINAL_STATUSES: readonly MhdLeavePaySourceStatus[] = ['ENDED', 'DENIED'];

const STATUS_VARIANTS: Readonly<Record<MhdLeavePaySourceStatus, MhdBadgeVariant>> = {
  EXPECTED: 'info',
  APPROVED: 'accent',
  PAYING: 'success',
  ENDED: 'neutral',
  DENIED: 'error',
};

/**
 * Recording a pay source opens in an action modal: `onRecord` resolves the RPC's non-blocking
 * warnings and rejects with its refusal, which the modal shows. The inline status select keeps
 * the older contract: warnings on success, `null` once the caller has shown a refusal.
 */
export interface MhdLeavePayCoordinationPanelProps {
  caseId: string;
  companyId: string | null;
  paySources: MhdLeavePaySource[];
  privileged: boolean;
  onRecord: (input: MhdLeavePaySourceInput) => Promise<MhdLeavePaySourceWarning[]>;
  onUpdateStatus: (
    input: MhdLeavePaySourceStatusInput,
  ) => Promise<MhdLeavePaySourceWarning[] | null>;
  isPending: boolean;
}

export function MhdLeavePayCoordinationPanel({
  caseId,
  companyId,
  paySources,
  privileged,
  onRecord,
  onUpdateStatus,
  isPending,
}: MhdLeavePayCoordinationPanelProps) {
  const [warnings, setWarnings] = useState<MhdLeavePaySourceWarning[]>([]);

  // The recorded rows carry the kind's display label; a key not yet recorded falls back to words.
  const sourceLabel = (key: MhdLeavePaySourceKey) =>
    paySources.find((item) => item.source_key === key)?.label || mhdLeaveEnumLabel(key);

  async function changeStatus(item: MhdLeavePaySource, value: string) {
    const next = mhdLeavePick(MHD_LEAVE_PAY_SOURCE_STATUSES, value);
    if (!next || next === item.status) return;
    const returned = await onUpdateStatus({ paySourceId: item.id, status: next });
    if (returned !== null) setWarnings(returned);
  }

  return (
    <div className="space-y-3">
      {warnings.length ? (
        <div role="status" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          {warnings.map((warning) => (
            <p key={warning}>{MHD_LEAVE_PAY_SOURCE_WARNING_MESSAGES[warning] ?? warning}</p>
          ))}
        </div>
      ) : null}

      {privileged ? (
        <div className="flex justify-end">
          <MhdLeaveActionModal
            caseId={caseId}
            action="pay-source"
            companyId={companyId}
            title="Record Pay Source"
            size="md"
            launchLabel="Add Pay Source"
          >
            <PaySourceForm
              caseId={caseId}
              sourceLabel={sourceLabel}
              isPending={isPending}
              onSubmit={async (input) => setWarnings(await onRecord(input))}
            />
          </MhdLeaveActionModal>
        </div>
      ) : null}

      {paySources.length ? (
        paySources.map((item) => (
          <MhdCard key={item.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-foreground">
                {item.label || mhdLeaveEnumLabel(item.source_key)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {item.employer_required ? (
                  <MhdBadge variant="warning">Required By Employer</MhdBadge>
                ) : null}
                <MhdBadge variant={STATUS_VARIANTS[item.status]}>
                  {mhdLeaveEnumLabel(item.status)}
                </MhdBadge>
              </div>
            </div>
            <dl className="grid gap-2 sm:grid-cols-3">
              <MhdDetailField label="Paid from" value={item.paid_from} />
              <MhdDetailField label="Paid to" value={item.paid_to} />
              <MhdDetailField label="Claim reference" value={item.claim_ref} />
            </dl>
            {privileged ? (
              <label className="block text-xs">
                Pay status
                <select
                  className={`mt-1 ${inputClass}`}
                  value={item.status}
                  disabled={isPending || TERMINAL_STATUSES.includes(item.status)}
                  onChange={(event) => void changeStatus(item, event.target.value)}
                >
                  {MHD_LEAVE_PAY_SOURCE_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {mhdLeaveEnumLabel(value)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </MhdCard>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No pay sources recorded.</p>
      )}
    </div>
  );
}

function PaySourceForm({
  caseId,
  sourceLabel,
  isPending,
  onSubmit,
}: {
  caseId: string;
  sourceLabel: (key: MhdLeavePaySourceKey) => string;
  isPending: boolean;
  onSubmit: (input: MhdLeavePaySourceInput) => Promise<unknown>;
}) {
  const [sourceKey, setSourceKey] = useMhdLeaveDraftField<MhdLeavePaySourceKey>('sourceKey', 'PTO');
  const [status, setStatus] = useMhdLeaveDraftField<MhdLeavePaySourceStatus>('status', 'EXPECTED');
  const [claimRef, setClaimRef] = useMhdLeaveDraftField('claimRef', '');
  const [paidFrom, setPaidFrom] = useMhdLeaveDraftField('paidFrom', '');
  const [paidTo, setPaidTo] = useMhdLeaveDraftField('paidTo', '');
  const [employerRequired, setEmployerRequired] = useMhdLeaveDraftField('employerRequired', false);
  const [employeeAgrees, setEmployeeAgrees] = useMhdLeaveDraftField('employeeAgrees', false);

  const input: MhdLeavePaySourceInput = {
    caseId,
    sourceKey,
    status,
    claimRef: claimRef || null,
    paidFrom: paidFrom || null,
    paidTo: paidTo || null,
    employerRequired,
    mutualAgreement: sourceKey === 'EMPLOYER_SICK' ? employeeAgrees : false,
  };
  const invalid = mhdValidateLeavePaySource(input);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Statutory California paid sick leave is always the employee&apos;s choice. Only paid time
        off, and employer sick leave for the employee&apos;s own condition or by agreement, can be
        required.
      </p>
      <MhdFormFieldStack>
        <label className="block text-xs">
          Pay source
          <select
            className={`mt-1 ${inputClass}`}
            value={sourceKey}
            onChange={(event) =>
              setSourceKey(mhdLeavePick(MHD_LEAVE_PAY_SOURCE_KEYS, event.target.value) ?? 'PTO')
            }
          >
            {MHD_LEAVE_PAY_SOURCE_KEYS.map((value) => (
              <option key={value} value={value}>
                {sourceLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Status
          <select
            className={`mt-1 ${inputClass}`}
            value={status}
            onChange={(event) =>
              setStatus(
                mhdLeavePick(MHD_LEAVE_PAY_SOURCE_STATUSES, event.target.value) ?? 'EXPECTED',
              )
            }
          >
            {MHD_LEAVE_PAY_SOURCE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Claim reference
          <input
            className={`mt-1 ${inputClass}`}
            value={claimRef}
            onChange={(event) => setClaimRef(event.target.value)}
          />
        </label>
        <label className="block text-xs">
          Paid from
          <MhdDateField className={`mt-1 ${inputClass}`} value={paidFrom} onChange={setPaidFrom} />
        </label>
        <label className="block text-xs">
          Paid to
          <MhdDateField className={`mt-1 ${inputClass}`} value={paidTo} onChange={setPaidTo} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={employerRequired}
            onChange={(event) => setEmployerRequired(event.target.checked)}
          />
          Employer Is Requiring This
        </label>
        {sourceKey === 'EMPLOYER_SICK' ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={employeeAgrees}
              onChange={(event) => setEmployeeAgrees(event.target.checked)}
            />
            Employee Agrees
          </label>
        ) : null}
      </MhdFormFieldStack>
      {invalid ? (
        <p role="alert" className="text-sm text-rose-700">
          {invalid}
        </p>
      ) : null}
      <MhdLeaveActionButtons
        submitLabel="Record Pay Source"
        pendingLabel="Recording…"
        disabled={isPending || Boolean(invalid)}
        onSubmit={() => onSubmit(input)}
      />
    </div>
  );
}
