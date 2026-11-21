import { useState } from 'react';
import { Button } from '@/components/ui/Button';
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
import { mhdLeaveEnumLabel, mhdLeavePick } from './mhdLeaveLabels';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export interface MhdLeaveCaseControlsPanelProps {
  caseData: MhdLeaveWorkflow['case'];
  privileged: boolean;
  /** Each resolves true once saved; false when the caller showed a refusal. */
  onKeyEmployee: (input: MhdLeaveKeyEmployeeInput) => Promise<boolean>;
  onWorkersComp: (input: MhdLeaveWorkersCompInput) => Promise<boolean>;
  onEssentialFunctions: (providedOn: string | null) => Promise<boolean>;
  isPending: boolean;
}

/**
 * Case-level controls: the FMLA key-employee exception, workers' compensation concurrency and
 * delivery of the essential-functions list. The bundle returns `key_employee` and
 * `workers_comp` only to administrators; for anyone else they arrive null and the card says so.
 */
export function MhdLeaveCaseControlsPanel({
  caseData,
  privileged,
  onKeyEmployee,
  onWorkersComp,
  onEssentialFunctions,
  isPending,
}: MhdLeaveCaseControlsPanelProps) {
  return (
    <div className="space-y-3">
      <MhdCard className="space-y-3">
        <MhdCardHeader title="Key Employee" />
        <p className="text-xs text-muted-foreground">
          An FMLA-only exception. It does not apply to CFRA or Pregnancy Disability Leave.
        </p>
        {caseData.key_employee ? (
          <KeyEmployeeSection
            caseId={caseData.id}
            current={caseData.key_employee}
            privileged={privileged}
            isPending={isPending}
            onSubmit={onKeyEmployee}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Not Available</p>
        )}
      </MhdCard>

      <MhdCard className="space-y-3">
        <MhdCardHeader title="Workers' Compensation" />
        {caseData.workers_comp ? (
          <WorkersCompSection
            caseId={caseData.id}
            current={caseData.workers_comp}
            privileged={privileged}
            isPending={isPending}
            onSubmit={onWorkersComp}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Not Available</p>
        )}
      </MhdCard>

      <EssentialFunctionsSection
        providedOn={caseData.essential_functions_provided_on}
        privileged={privileged}
        isPending={isPending}
        onSubmit={onEssentialFunctions}
      />
    </div>
  );
}

function KeyEmployeeSection({
  caseId,
  current,
  privileged,
  isPending,
  onSubmit,
}: {
  caseId: string;
  current: MhdLeaveKeyEmployee;
  privileged: boolean;
  isPending: boolean;
  onSubmit: (input: MhdLeaveKeyEmployeeInput) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<MhdLeaveKeyEmployeeStatus>(current.status);
  const [determinedOn, setDeterminedOn] = useState(current.determined_on ?? '');
  const [noticeOn, setNoticeOn] = useState(current.notice_on ?? '');
  const [deniedOn, setDeniedOn] = useState(current.restoration_denied_notice_on ?? '');

  return (
    <>
      <dl className="grid gap-2 sm:grid-cols-2">
        <MhdDetailField label="Status" value={mhdLeaveEnumLabel(current.status)} />
        <MhdDetailField label="Determined on" value={current.determined_on} />
        <MhdDetailField label="Key-employee notice on" value={current.notice_on} />
        <MhdDetailField
          label="Restoration-denial notice on"
          value={current.restoration_denied_notice_on}
        />
      </dl>
      {privileged ? (
        <div className="space-y-3 border-t border-border pt-3">
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
              <MhdDateField
                className={`mt-1 ${inputClass}`}
                value={noticeOn}
                onChange={setNoticeOn}
              />
            </label>
            <label className="block text-xs">
              Restoration-denial notice date
              <MhdDateField
                className={`mt-1 ${inputClass}`}
                value={deniedOn}
                onChange={setDeniedOn}
              />
            </label>
          </MhdFormFieldStack>
          <Button
            disabled={isPending}
            onClick={() =>
              void onSubmit({
                caseId,
                status,
                determinedOn: determinedOn || null,
                noticeOn: noticeOn || null,
                restorationDeniedNoticeOn: deniedOn || null,
              })
            }
          >
            Save Key Employee
          </Button>
        </div>
      ) : null}
    </>
  );
}

function WorkersCompSection({
  caseId,
  current,
  privileged,
  isPending,
  onSubmit,
}: {
  caseId: string;
  current: MhdLeaveWorkersComp;
  privileged: boolean;
  isPending: boolean;
  onSubmit: (input: MhdLeaveWorkersCompInput) => Promise<boolean>;
}) {
  const [claim, setClaim] = useState(current.claim);
  const [filedOn, setFiledOn] = useState(current.claim_filed_on ?? '');
  const [concurrentOn, setConcurrentOn] = useState(current.concurrent_designated_on ?? '');
  const [lightDutyNote, setLightDutyNote] = useState(current.light_duty_declined_note ?? '');

  return (
    <>
      <dl className="grid gap-2 sm:grid-cols-2">
        <MhdDetailField label="Claim" value={current.claim ? 'Yes' : 'No'} />
        <MhdDetailField label="Claim filed on" value={current.claim_filed_on} />
        <MhdDetailField
          label="Concurrent designation on"
          value={current.concurrent_designated_on}
        />
        <MhdDetailField label="Light-duty note" value={current.light_duty_declined_note} />
      </dl>
      {privileged ? (
        <div className="space-y-3 border-t border-border pt-3">
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
              <MhdDateField
                className={`mt-1 ${inputClass}`}
                value={filedOn}
                onChange={setFiledOn}
              />
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
          <Button
            disabled={isPending}
            onClick={() =>
              void onSubmit({
                caseId,
                claim,
                filedOn: filedOn || null,
                concurrentDesignatedOn: concurrentOn || null,
                lightDutyDeclinedNote: lightDutyNote || null,
              })
            }
          >
            Save Workers&apos; Compensation
          </Button>
        </div>
      ) : null}
    </>
  );
}

function EssentialFunctionsSection({
  providedOn,
  privileged,
  isPending,
  onSubmit,
}: {
  providedOn: string | null;
  privileged: boolean;
  isPending: boolean;
  onSubmit: (providedOn: string | null) => Promise<boolean>;
}) {
  const [deliveredOn, setDeliveredOn] = useState('');

  async function submit() {
    const saved = await onSubmit(deliveredOn || null);
    if (saved) setDeliveredOn('');
  }

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader title="Essential Functions" />
      <p className="text-xs text-muted-foreground">
        The list of essential functions from the published job description, delivered with the
        designation notice when a fitness-for-duty certification will address them.
      </p>
      <dl>
        <MhdDetailField label="Provided on" value={providedOn} />
      </dl>
      {privileged ? (
        <div className="space-y-3 border-t border-border pt-3">
          <label className="block text-xs">
            Delivery date (blank records today)
            <MhdDateField
              className={`mt-1 ${inputClass}`}
              value={deliveredOn}
              onChange={setDeliveredOn}
            />
          </label>
          <Button disabled={isPending} onClick={() => void submit()}>
            Record Delivery With Designation
          </Button>
        </div>
      ) : null}
    </MhdCard>
  );
}
