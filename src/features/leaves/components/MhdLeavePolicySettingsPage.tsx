import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import { useMhdLeavePolicy, useMhdSetLeavePolicy } from '../PolicyHook';
import {
  MHD_LEAVE_YEAR_METHODS,
  type MhdLeavePolicyElection,
  type MhdLeaveYearMethod,
} from '../WorkflowTypes';
import { mhdValidateLeavePolicySet } from '../WorkflowValidation';

const YEAR_METHOD_LABELS: Record<MhdLeaveYearMethod, string> = {
  CALENDAR_YEAR: 'Calendar Year',
  FIXED_YEAR: 'Fixed Leave Year',
  ROLLING_FORWARD: 'Measured Forward',
  ROLLING_BACKWARD: 'Measured Backward',
};

const NO_ELECTION_LABEL = 'Most Favorable To The Employee — No Election Recorded';
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const FIELD_CLASS = 'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm';
const DISABLED_FIELD_CLASS = 'disabled:bg-muted disabled:text-muted-foreground';

function monthName(month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2001, month - 1, 1)),
  );
}

function methodLabel(method: MhdLeaveYearMethod | null): string {
  return method ? YEAR_METHOD_LABELS[method] : NO_ELECTION_LABEL;
}

function anchorLabel(
  method: MhdLeaveYearMethod | null,
  month: number | null,
  day: number | null,
): string {
  if (method !== 'FIXED_YEAR' || !month || !day) return '—';
  return `${monthName(month)} ${day}`;
}

function ElectionSummary({
  method,
  anchorMonth,
  anchorDay,
  effectiveFrom,
  limitDesignatedPerson,
  rtwUniform,
}: {
  method: MhdLeaveYearMethod | null;
  anchorMonth: number | null;
  anchorDay: number | null;
  effectiveFrom: string | null;
  limitDesignatedPerson: boolean;
  rtwUniform: boolean;
}) {
  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">Leave-Year Method</dt>
        <dd className="font-medium text-foreground">{methodLabel(method)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Anchor Date</dt>
        <dd className="font-medium text-foreground">
          {anchorLabel(method, anchorMonth, anchorDay)}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Effective Date</dt>
        <dd className="font-medium text-foreground">{mhdFormatDate(effectiveFrom)}</dd>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <MhdBadge variant={limitDesignatedPerson ? 'info' : 'neutral'}>
          Limit Designated Person To One Per 12 Months: {limitDesignatedPerson ? 'On' : 'Off'}
        </MhdBadge>
        <MhdBadge variant={rtwUniform ? 'info' : 'neutral'}>
          Uniform Return-To-Work Certification Policy: {rtwUniform ? 'On' : 'Off'}
        </MhdBadge>
      </div>
    </dl>
  );
}

function flagSummary(election: MhdLeavePolicyElection): string {
  const flags: string[] = [];
  if (election.limit_designated_person) flags.push('Designated Person Limit');
  if (election.rtw_certification_uniform_policy) flags.push('Uniform Return-To-Work');
  return flags.length > 0 ? flags.join(', ') : '—';
}

/**
 * `/leaves/settings` — the company's election of the 12-month leave-year method and the two
 * related policy flags (migration 0381). Elections are append-only history; the database enforces
 * the 60-day notice for a method change and returns a user-safe message (22023) on refusal.
 */
export function MhdLeavePolicySettingsPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? null;
  const policyQuery = useMhdLeavePolicy(companyId);
  const setPolicy = useMhdSetLeavePolicy(companyId);

  const [yearMethod, setYearMethod] = useState<MhdLeaveYearMethod>('CALENDAR_YEAR');
  const [anchorMonth, setAnchorMonth] = useState('');
  const [anchorDay, setAnchorDay] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [limitDesignatedPerson, setLimitDesignatedPerson] = useState(false);
  const [rtwUniform, setRtwUniform] = useState(false);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const policy = policyQuery.data;
  const history = [...(policy?.history ?? [])].sort(
    (a, b) =>
      b.effective_from.localeCompare(a.effective_from) || b.created_at.localeCompare(a.created_at),
  );
  const reasonRequired = history.length > 0;
  const anchorEnabled = yearMethod === 'FIXED_YEAR';

  function clearForm() {
    setYearMethod('CALENDAR_YEAR');
    setAnchorMonth('');
    setAnchorDay('');
    setEffectiveFrom('');
    setLimitDesignatedPerson(false);
    setRtwUniform(false);
    setReason('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) return;
    setErrorMessage(null);
    const input = {
      companyId,
      yearMethod,
      anchorMonth: anchorEnabled && anchorMonth ? Number(anchorMonth) : null,
      anchorDay: anchorEnabled && anchorDay ? Number(anchorDay) : null,
      effectiveFrom: effectiveFrom || null,
      limitDesignatedPerson,
      rtwCertificationUniform: rtwUniform,
      reason: reason.trim() || null,
    };
    const invalid = mhdValidateLeavePolicySet(input);
    if (invalid) {
      setErrorMessage(invalid);
      return;
    }
    if (reasonRequired && !input.reason) {
      setErrorMessage('Enter the reason for this change.');
      return;
    }
    try {
      await setPolicy.mutateAsync(input);
      clearForm();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to record the election.');
    }
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/leaves"
        backLabel="Leaves of absence"
        title="Leave Policy Settings"
        description="The company's election of how the 12-month leave year is measured, plus two related policy flags."
      />

      {policyQuery.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading…</MhdCard>
      ) : policyQuery.isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {policyQuery.error instanceof Error
            ? policyQuery.error.message
            : 'Unable to load the leave policy.'}
        </div>
      ) : policy ? (
        <MhdCard className="space-y-4 p-6">
          <h2 className="text-base font-semibold text-foreground">Current Election</h2>
          <ElectionSummary
            method={policy.year_method}
            anchorMonth={policy.anchor_month}
            anchorDay={policy.anchor_day}
            effectiveFrom={policy.effective_from}
            limitDesignatedPerson={policy.limit_designated_person}
            rtwUniform={policy.rtw_certification_uniform_policy}
          />
          {policy.upcoming ? (
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Upcoming Election</h3>
              <ElectionSummary
                method={policy.upcoming.year_method}
                anchorMonth={policy.upcoming.anchor_month}
                anchorDay={policy.upcoming.anchor_day}
                effectiveFrom={policy.upcoming.effective_from}
                limitDesignatedPerson={policy.upcoming.limit_designated_person}
                rtwUniform={policy.upcoming.rtw_certification_uniform_policy}
              />
            </div>
          ) : null}
        </MhdCard>
      ) : null}

      <MhdCard className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Record An Election</h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <MhdFormFieldStack>
            <div>
              <label
                htmlFor="leaveYearMethod"
                className="block text-sm font-medium text-foreground"
              >
                Leave-Year Method
              </label>
              <select
                id="leaveYearMethod"
                value={yearMethod}
                onChange={(event) => setYearMethod(event.target.value as MhdLeaveYearMethod)}
                className={FIELD_CLASS}
              >
                {MHD_LEAVE_YEAR_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {YEAR_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="anchorMonth" className="block text-sm font-medium text-foreground">
                Anchor Month
              </label>
              <select
                id="anchorMonth"
                value={anchorMonth}
                disabled={!anchorEnabled}
                onChange={(event) => setAnchorMonth(event.target.value)}
                className={`${FIELD_CLASS} ${DISABLED_FIELD_CLASS}`}
              >
                <option value="">Select A Month</option>
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {monthName(month)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="anchorDay" className="block text-sm font-medium text-foreground">
                Anchor Day
              </label>
              <input
                id="anchorDay"
                type="number"
                min={1}
                max={31}
                value={anchorDay}
                disabled={!anchorEnabled}
                onChange={(event) => setAnchorDay(event.target.value)}
                className={`${FIELD_CLASS} ${DISABLED_FIELD_CLASS}`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The anchor applies only to a Fixed Leave Year.
              </p>
            </div>

            <div>
              <label htmlFor="effectiveFrom" className="block text-sm font-medium text-foreground">
                Effective From
              </label>
              <MhdDateField id="effectiveFrom" value={effectiveFrom} onChange={setEffectiveFrom} />
            </div>

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={limitDesignatedPerson}
                onChange={(event) => setLimitDesignatedPerson(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span>Limit Designated Person To One Per 12 Months</span>
            </label>

            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={rtwUniform}
                onChange={(event) => setRtwUniform(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span>Uniform Return-To-Work Certification Policy</span>
            </label>

            <div>
              <label htmlFor="policyReason" className="block text-sm font-medium text-foreground">
                Reason{' '}
                {reasonRequired ? null : (
                  <span className="font-normal text-muted-foreground">(optional)</span>
                )}
              </label>
              <textarea
                id="policyReason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </MhdFormFieldStack>

          <p className="text-xs text-muted-foreground">
            Changing the leave-year method needs 60 days&apos; notice. Changing only a flag takes
            effect on the date you choose.
          </p>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={!companyId || setPolicy.isPending}>
              {setPolicy.isPending ? 'Saving…' : 'Record Election'}
            </Button>
          </div>
        </form>
      </MhdCard>

      <MhdCard className="overflow-hidden p-0">
        <h2 className="px-6 pt-6 text-base font-semibold text-foreground">Election History</h2>
        {history.length === 0 ? (
          <MhdEmptyState title="No election has been recorded." />
        ) : (
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Effective From</MhdTh>
                <MhdTh>Method</MhdTh>
                <MhdTh>Anchor</MhdTh>
                <MhdTh>Flags</MhdTh>
                <MhdTh>Reason</MhdTh>
                <MhdTh>Recorded On</MhdTh>
              </tr>
            </thead>
            <tbody>
              {history.map((election) => (
                <MhdTr key={election.id}>
                  <MhdTd className="whitespace-nowrap">
                    {mhdFormatDate(election.effective_from)}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap">{methodLabel(election.year_method)}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {anchorLabel(election.year_method, election.anchor_month, election.anchor_day)}
                  </MhdTd>
                  <MhdTd className="text-muted-foreground">{flagSummary(election)}</MhdTd>
                  <MhdTd className="text-muted-foreground">{election.change_reason ?? '—'}</MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {mhdFormatDate(election.created_at)}
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        )}
      </MhdCard>
    </div>
  );
}
