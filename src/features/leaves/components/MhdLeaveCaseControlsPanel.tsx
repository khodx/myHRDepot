import { useState } from 'react';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import {
  MHD_LEAVE_KEY_EMPLOYEE_STATUSES,
  type MhdLeaveKeyEmployee,
  type MhdLeaveKeyEmployeeInput,
  type MhdLeaveKeyEmployeeStatus,
  type MhdLeaveWorkersComp,
  type MhdLeaveWorkersCompInput,
  type MhdLeaveWorkflow,
} from '../WorkflowTypes';
import { MhdLeaveActionButtons, MhdLeaveActionModal } from './MhdLeaveActionModal';
import { useMhdLeaveDraftField } from './mhdLeaveActionContext';
import { mhdLeaveEnumLabel, mhdLeavePick } from './mhdLeaveLabels';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export interface MhdLeaveCaseControlsPanelProps {
  caseData: MhdLeaveWorkflow['case'];
  privileged: boolean;
  /** Each rejects with the server's refusal, which the action modal shows. */
  onKeyEmployee: (input: MhdLeaveKeyEmployeeInput) => Promise<unknown>;
  onWorkersComp: (input: MhdLeaveWorkersCompInput) => Promise<unknown>;
  onEssentialFunctions: (providedOn: string | null) => Promise<unknown>;
  isPending: boolean;
}

/**
 * Case-level controls: the FMLA key-employee exception, workers' compensation concurrency and
 * delivery of the essential-functions list. The bundle returns `key_employee` and
 * `workers_comp` only to administrators; for anyone else they arrive null and the card says so.
 * The cards show what is recorded; each change opens in an action modal.
 */
export function MhdLeaveCaseControlsPanel({
  caseData,
  privileged,
  onKeyEmployee,
  onWorkersComp,
  onEssentialFunctions,
  isPending,
}: MhdLeaveCaseControlsPanelProps) {
  const scope = { caseId: caseData.id, companyId: caseData.company_id };
  return (
    <div className="space-y-3">
      <MhdCard className="space-y-3">
        <MhdCardHeader title="Key Employee" />
        <p className="text-xs text-muted-foreground">
          An FMLA-only exception. It does not apply to CFRA or Pregnancy Disability Leave.
        </p>
        {caseData.key_employee ? (
          <>
            <dl className="grid gap-2 sm:grid-cols-2">
              <MhdDetailField
                label="Status"
                value={mhdLeaveEnumLabel(caseData.key_employee.status)}
              />
              <MhdDetailField label="Determined on" value={caseData.key_employee.determined_on} />
              <MhdDetailField
                label="Key-employee notice on"
                value={caseData.key_employee.notice_on}
              />
              <MhdDetailField
                label="Restoration-denial notice on"
                value={caseData.key_employee.restoration_denied_notice_on}
              />
            </dl>
            {privileged ? (
              <MhdLeaveActionModal
                {...scope}
                action="key-employee"
                title="Key Employee"
                size="md"
                launchLabel="Edit Key Employee"
              >
                <KeyEmployeeForm
                  caseId={caseData.id}
                  current={caseData.key_employee}
                  isPending={isPending}
                  onSubmit={onKeyEmployee}
                />
              </MhdLeaveActionModal>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Not Available</p>
        )}
      </MhdCard>

      <MhdCard className="space-y-3">
        <MhdCardHeader title="Workers' Compensation" />
        {caseData.workers_comp ? (
          <>
            <dl className="grid gap-2 sm:grid-cols-2">
              <MhdDetailField label="Claim" value={caseData.workers_comp.claim ? 'Yes' : 'No'} />
              <MhdDetailField label="Claim filed on" value={caseData.workers_comp.claim_filed_on} />
              <MhdDetailField
                label="Concurrent designation on"
                value={caseData.workers_comp.concurrent_designated_on}
              />
              <MhdDetailField
                label="Light-duty note"
                value={caseData.workers_comp.light_duty_declined_note}
              />
            </dl>
            {privileged ? (
              <MhdLeaveActionModal
                {...scope}
                action="workers-comp"
                title="Workers' Compensation"
                size="md"
                launchLabel="Edit Workers' Compensation"
                medicalFields
              >
                <WorkersCompForm
                  caseId={caseData.id}
                  current={caseData.workers_comp}
                  isPending={isPending}
                  onSubmit={onWorkersComp}
                />
              </MhdLeaveActionModal>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Not Available</p>
        )}
      </MhdCard>

      <MhdCard className="space-y-3">
        <MhdCardHeader title="Essential Functions" />
        <p className="text-xs text-muted-foreground">
          The list of essential functions from the published job description, delivered with the
          designation notice when a fitness-for-duty certification will address them.
        </p>
        <dl>
          <MhdDetailField label="Provided on" value={caseData.essential_functions_provided_on} />
        </dl>
        {privileged ? (
          <MhdLeaveActionModal
            {...scope}
            action="essential-functions"
            title="Record Essential Functions Delivery"
            size="md"
            launchLabel="Record Delivery"
          >
            <EssentialFunctionsForm isPending={isPending} onSubmit={onEssentialFunctions} />
          </MhdLeaveActionModal>
        ) : null}
      </MhdCard>
    </div>
  );
}

function KeyEmployeeForm({
  caseId,
  current,
  isPending,
  onSubmit,
}: {
  caseId: string;
  current: MhdLeaveKeyEmployee;
  isPending: boolean;
  onSubmit: (input: MhdLeaveKeyEmployeeInput) => Promise<unknown>;
}) {
  const [status, setStatus] = useMhdLeaveDraftField<MhdLeaveKeyEmployeeStatus>(
    'status',
    current.status,
  );
  const [determinedOn, setDeterminedOn] = useMhdLeaveDraftField(
    'determinedOn',
    current.determined_on ?? '',
  );
  const [noticeOn, setNoticeOn] = useMhdLeaveDraftField('noticeOn', current.notice_on ?? '');
  const [deniedOn, setDeniedOn] = useMhdLeaveDraftField(
    'restorationDeniedNoticeOn',
    current.restoration_denied_notice_on ?? '',
  );

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="block text-xs">
          Key employee status
          <select
            className={`mt-1 ${inputClass}`}
            value={status}
            onChange={(event) =>
              setStatus(
                mhdLeavePick(MHD_LEAVE_KEY_EMPLOYEE_STATUSES, event.target.value) ??
                  'NOT_DETERMINED',
              )
            }
          >
            {MHD_LEAVE_KEY_EMPLOYEE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {mhdLeaveEnumLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Determination date
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={determinedOn}
            onChange={setDeterminedOn}
          />
        </label>
        <label className="block text-xs">
          Key-employee notice date
          <MhdDateField className={`mt-1 ${inputClass}`} value={noticeOn} onChange={setNoticeOn} />
        </label>
        <label className="block text-xs">
          Restoration-denial notice date
          <MhdDateField className={`mt-1 ${inputClass}`} value={deniedOn} onChange={setDeniedOn} />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Save Key Employee"
        disabled={isPending}
        onSubmit={() =>
          onSubmit({
            caseId,
            status,
            determinedOn: determinedOn || null,
            noticeOn: noticeOn || null,
            restorationDeniedNoticeOn: deniedOn || null,
          })
        }
      />
    </div>
  );
}

/** The light-duty note can describe work restrictions, so it is never kept in a draft. */
function WorkersCompForm({
  caseId,
  current,
  isPending,
  onSubmit,
}: {
  caseId: string;
  current: MhdLeaveWorkersComp;
  isPending: boolean;
  onSubmit: (input: MhdLeaveWorkersCompInput) => Promise<unknown>;
}) {
  const [claim, setClaim] = useMhdLeaveDraftField('claim', current.claim);
  const [filedOn, setFiledOn] = useMhdLeaveDraftField('filedOn', current.claim_filed_on ?? '');
  const [concurrentOn, setConcurrentOn] = useMhdLeaveDraftField(
    'concurrentDesignatedOn',
    current.concurrent_designated_on ?? '',
  );
  const [lightDutyNote, setLightDutyNote] = useState(current.light_duty_declined_note ?? '');

  return (
    <div className="space-y-3">
      <MhdFormFieldStack>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={claim}
            onChange={(event) => setClaim(event.target.checked)}
          />
          Workers&apos; Compensation Claim
        </label>
        <label className="block text-xs">
          Date filed
          <MhdDateField className={`mt-1 ${inputClass}`} value={filedOn} onChange={setFiledOn} />
        </label>
        <label className="block text-xs">
          Concurrent designation date
          <MhdDateField
            className={`mt-1 ${inputClass}`}
            value={concurrentOn}
            onChange={setConcurrentOn}
          />
        </label>
        <label className="block text-xs">
          Light-duty note
          <textarea
            className={`mt-1 min-h-16 ${inputClass}`}
            value={lightDutyNote}
            onChange={(event) => setLightDutyNote(event.target.value)}
          />
        </label>
      </MhdFormFieldStack>
      <MhdLeaveActionButtons
        submitLabel="Save Workers' Compensation"
        disabled={isPending}
        onSubmit={() =>
          onSubmit({
            caseId,
            claim,
            filedOn: filedOn || null,
            concurrentDesignatedOn: concurrentOn || null,
            lightDutyDeclinedNote: lightDutyNote || null,
          })
        }
      />
    </div>
  );
}

function EssentialFunctionsForm({
  isPending,
  onSubmit,
}: {
  isPending: boolean;
  onSubmit: (providedOn: string | null) => Promise<unknown>;
}) {
  const [deliveredOn, setDeliveredOn] = useMhdLeaveDraftField('deliveredOn', '');
  return (
    <div className="space-y-3">
      <label className="block text-xs">
        Delivery date (blank records today)
        <MhdDateField
          className={`mt-1 ${inputClass}`}
          value={deliveredOn}
          onChange={setDeliveredOn}
        />
      </label>
      <MhdLeaveActionButtons
        submitLabel="Record Delivery With Designation"
        disabled={isPending}
        onSubmit={() => onSubmit(deliveredOn || null)}
      />
    </div>
  );
}
