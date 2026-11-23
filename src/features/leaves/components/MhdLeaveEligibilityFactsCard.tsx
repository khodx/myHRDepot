import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { mhdLeavesIsHr } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdLeaveEligibilityFacts, useMhdSetLeaveCaseAnswers } from '../WorkflowHook';

const show = (value: number | null | undefined) =>
  value == null ? 'Not available' : String(value);

/**
 * The facts the latest evaluation used and where each came from. HR only: the snapshot holds the
 * payroll hours, which the server returns to no one else.
 */
type Answer = 'UNKNOWN' | 'YES' | 'NO';
const toAnswer = (value: boolean | null | undefined): Answer =>
  value == null ? 'UNKNOWN' : value ? 'YES' : 'NO';
const fromAnswer = (value: Answer): boolean | null =>
  value === 'UNKNOWN' ? null : value === 'YES';

interface MhdLeaveEligibilityFactsCardProps {
  caseId: string;
  familyRelationship: string | null;
  reasonCode: string | null;
  isIntermittent: boolean;
}

export function MhdLeaveEligibilityFactsCard({
  caseId,
  familyRelationship,
  reasonCode,
  isIntermittent,
}: MhdLeaveEligibilityFactsCardProps) {
  const { roles } = useMhdAuth();
  const isHr = mhdLeavesIsHr(roles);
  const facts = useMhdLeaveEligibilityFacts(caseId, isHr);
  const setAnswers = useMhdSetLeaveCaseAnswers(caseId);
  const [selfCare, setSelfCare] = useState<Answer | null>(null);
  const [agreed, setAgreed] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const asksSelfCare = familyRelationship === 'CHILD_ADULT';
  const asksAgreement = reasonCode === 'BONDING' && isIntermittent;
  if (!isHr) return null;
  const f = facts.data;
  const p = f?.provenance;
  const selfCareValue = selfCare ?? toAnswer(f?.adultChildIncapableOfSelfCare);
  const agreedValue = agreed ?? toAnswer(f?.employerAgreedIntermittentBonding);

  async function saveAnswers() {
    setError(null);
    try {
      await setAnswers.mutateAsync({
        adultChildIncapableOfSelfCare: fromAnswer(selfCareValue),
        employerAgreedIntermittentBonding: fromAnswer(agreedValue),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The answers could not be saved.');
    }
  }

  return (
    <>
      {asksSelfCare || asksAgreement ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Eligibility Answers" />
          <p className="text-xs text-muted-foreground">
            These two answers belong to this case. Run the evaluation again after saving.
          </p>
          {asksSelfCare ? (
            <label className="block text-sm">
              Adult child is unable to care for themself because of a disability
              <select
                className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm"
                value={selfCareValue}
                onChange={(event) => setSelfCare(event.target.value as Answer)}
              >
                <option value="UNKNOWN">Not yet known</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </label>
          ) : null}
          {asksAgreement ? (
            <label className="block text-sm">
              Employer agrees to intermittent bonding leave
              <select
                className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm"
                value={agreedValue}
                onChange={(event) => setAgreed(event.target.value as Answer)}
              >
                <option value="UNKNOWN">Not yet known</option>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </label>
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <Button disabled={setAnswers.isPending} onClick={() => void saveAnswers()}>
            {setAnswers.isPending ? 'Saving…' : 'Save Answers'}
          </Button>
        </MhdCard>
      ) : null}
      {f ? (
        <MhdCard className="space-y-3">
          <MhdCardHeader title="Facts Used In This Evaluation" />
          <p className="text-xs text-muted-foreground">
            Company facts come from company records as of {f.asOfDate}. Hours worked come from the
            payroll record HR entered. Nothing here was typed into the request.
          </p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <MhdDetailField label="Employer employees" value={show(f.employerEmployeeCount)} />
            <MhdDetailField label="Months of service" value={show(f.monthsOfService)} />
            <MhdDetailField
              label="Hours worked, prior 12 months"
              value={show(f.hoursWorked12Months)}
            />
            <MhdDetailField label="Scheduled weekly hours" value={show(f.scheduledWeeklyHours)} />
            <MhdDetailField
              label={`Employees within 75 miles${p?.worksite_name ? ` of ${p.worksite_name}` : ''}`}
              value={show(f.worksiteEmployeeCount75)}
            />
          </dl>
          {p?.worksite_confirmation_needed ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              HR confirmation needed: {p.worksite_employees_near_boundary ?? 0} employees are near
              the 75-mile boundary, so the count could change the FMLA result.
            </p>
          ) : null}
          {p?.employees_without_worksite ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              {p.employees_without_worksite} employees have no worksite assignment and are not
              counted.
            </p>
          ) : null}
        </MhdCard>
      ) : null}
    </>
  );
}
