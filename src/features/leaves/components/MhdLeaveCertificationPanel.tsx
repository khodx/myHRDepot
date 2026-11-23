import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdDateField } from '@/components/ui/MhdDateField';
import {
  MHD_LEAVE_CERTIFICATION_STATUSES,
  MHD_LEAVE_CERTIFICATION_TYPES,
  mhdFormatLeaveCertificationType,
  type MhdLeaveCertification,
  type MhdMarkCertificationInput,
  type MhdLeaveCertificationStatus,
  type MhdRecordCertificationInput,
  type MhdUpdateCertificationStatusInput,
} from '../Types';
import {
  MHD_LEAVE_CERTIFICATION_CLEARABLE_DATES,
  type MhdLeaveCertificationClearableDate,
  type MhdLeaveCertificationClearDatesInput,
  type MhdLeaveWorkflow,
} from '../WorkflowTypes';
import { MhdLeaveActionButtons, MhdLeaveActionModal } from './MhdLeaveActionModal';
import { useMhdLeaveAction } from './mhdLeaveActionContext';

interface Props {
  caseId: string;
  companyId?: string | null;
  certifications: MhdLeaveCertification[];
  /**
   * The workflow record's certifications, matched to the rows above by id. They carry the
   * operational fields `mhd_leave_cert_list` omits (status, deficiency and cure dates).
   * Optional: without a match the panel still works, it just cannot show them.
   */
  workflowCertifications?: MhdLeaveWorkflow['certifications'];
  /**
   * Whether this viewer is Platform Admin or HR Partner. Passed from the ROUTE,
   * not inferred from the rows — the rows cannot answer it, see below.
   */
  canSeeMedical: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  /** Each rejects with the server's refusal, which the action modal shows verbatim. */
  onRecord: (input: MhdRecordCertificationInput) => Promise<void>;
  onMarkSufficient: (input: MhdMarkCertificationInput) => Promise<void>;
  onUpdateStatus: (input: MhdUpdateCertificationStatusInput) => Promise<void>;
  /** Removes recorded dates with a reason (medical roles only; the RPC re-checks the gate). */
  onClearDates: (input: MhdLeaveCertificationClearDatesInput) => Promise<void>;
}

const CLEARABLE_DATE_LABELS: Readonly<Record<MhdLeaveCertificationClearableDate, string>> = {
  received_at: 'Received Date',
  deficiency_notified_at: 'Deficiency Notified Date (And Its Cure Date)',
  requested_at: 'Requested Date',
};

const INPUT_CLASSES =
  'rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/**
 * The medical-certification partition, rendered.
 *
 * 29 CFR 825.500(g) requires certification and medical-history records be kept
 * apart from the personnel file, so the server keeps them in their own table
 * behind a tighter gate than general leave administration: Platform Admin and HR
 * Partner ONLY — never a Client Admin, and never the subject's manager. The
 * `mhd_leave_cert_list` RPC returns `providerNote` and `driveFileId` as NULL to
 * anyone below that gate.
 *
 * That null is ambiguous on its own — "you may not see this" reads identically
 * to "no note was recorded" — which is deliberate (the medical content genuinely
 * never reaches an unprivileged client) but means this component needs
 * `canSeeMedical` from the route to word itself honestly, exactly as the Jobs
 * pay-range field does. When the viewer cannot see medical detail, the note
 * reads "Restricted"; the component never implies content exists that it cannot
 * show, and never renders provider detail to a Client Admin or the subject.
 *
 * Everyone who can view the case still learns THAT a certification exists and
 * its status (required / received / sufficient / due) — that part is not
 * medical. Only the content stays behind the gate.
 *
 * Recording, reviewing, status updates and date clearing each open in an action modal that
 * keeps NO draft: every field here belongs to the medical partition.
 */
export function MhdLeaveCertificationPanel({
  caseId,
  companyId = null,
  certifications,
  workflowCertifications = [],
  canSeeMedical,
  isLoading = false,
  isSubmitting = false,
  onRecord,
  onMarkSufficient,
  onUpdateStatus,
  onClearDates,
}: Props) {
  const operationalById = new Map(workflowCertifications.map((item) => [item.id, item]));
  const scope = { caseId, companyId, draftable: false, size: 'md' as const };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Medical certifications</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {canSeeMedical
              ? 'Kept apart from the personnel record. Visible to HR Partner and Platform Admin only.'
              : 'Whether a certification is required and its status. Medical detail is restricted.'}
          </p>
        </div>
        {/* Recording and reviewing a certification touch the medical table, so
            those controls exist only for a viewer who can see medical detail —
            the RPCs re-check the gate regardless. */}
        {canSeeMedical ? (
          <MhdLeaveActionModal
            {...scope}
            action="certification"
            title="Record Certification"
            launchLabel="Record Certification"
          >
            <RecordCertificationForm
              caseId={caseId}
              isSubmitting={isSubmitting}
              onSubmit={onRecord}
            />
          </MhdLeaveActionModal>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading certifications…</p>
      ) : certifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certifications on record for this case.</p>
      ) : (
        <ul className="space-y-2">
          {certifications.map((cert) => (
            // MhdCard renders a div, which is invalid inside <ul>; the li carries
            // the card recipe inline instead.
            <li key={cert.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {mhdFormatLeaveCertificationType(cert.certificationType)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {cert.dueDate ? `Due ${cert.dueDate}` : 'No due date'}
                    {cert.receivedAt ? ` · received ${cert.receivedAt}` : ' · not yet received'}
                  </p>
                  {operationalById.get(cert.id) ? (
                    <MhdCertificationOperationalFacts facts={operationalById.get(cert.id)!} />
                  ) : null}
                </div>
                <MhdBadge
                  variant={
                    cert.sufficient == null ? 'warning' : cert.sufficient ? 'success' : 'error'
                  }
                >
                  {cert.sufficient == null
                    ? 'Pending review'
                    : cert.sufficient
                      ? 'Sufficient'
                      : 'Insufficient'}
                </MhdBadge>
              </div>

              {/*
                The provider note. Masked callers get NULL from the server and a
                "Restricted" label here — never a hint that content exists.
                Privileged callers see the note, or an honest "no note recorded"
                when it is genuinely empty. This is the pay-range masking pattern,
                applied where the stakes are higher.
              */}
              <div className="mt-2 text-xs">
                <span className="uppercase tracking-wide text-muted-foreground">Provider note</span>
                {!canSeeMedical ? (
                  <p className="italic text-muted-foreground">Restricted — visible to HR only.</p>
                ) : cert.providerNote ? (
                  <p className="text-foreground">{cert.providerNote}</p>
                ) : (
                  <p className="text-muted-foreground">No note recorded.</p>
                )}
                {canSeeMedical && cert.driveFileId ? (
                  <p className="mt-1 text-muted-foreground">Document on file: {cert.driveFileId}</p>
                ) : null}
              </div>

              {canSeeMedical ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <MhdLeaveActionModal
                    {...scope}
                    action={`certification-review:${cert.id}`}
                    title="Review Sufficiency"
                    launchLabel="Review Sufficiency"
                  >
                    <ReviewSufficiencyForm
                      certId={cert.id}
                      isSubmitting={isSubmitting}
                      onSubmit={onMarkSufficient}
                    />
                  </MhdLeaveActionModal>
                  <MhdLeaveActionModal
                    {...scope}
                    action={`certification-status:${cert.id}`}
                    title="Update Certification Status"
                    launchLabel="Update Status"
                  >
                    <CertificationStatusForm
                      certId={cert.id}
                      currentStatus={operationalById.get(cert.id)?.status}
                      isSubmitting={isSubmitting}
                      onSubmit={onUpdateStatus}
                    />
                  </MhdLeaveActionModal>
                  <MhdLeaveActionModal
                    {...scope}
                    action={`certification-clear:${cert.id}`}
                    title="Clear A Date"
                    launchLabel="Clear A Date"
                  >
                    <ClearDatesForm
                      certificationId={cert.id}
                      isSubmitting={isSubmitting}
                      onSubmit={onClearDates}
                    />
                  </MhdLeaveActionModal>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecordCertificationForm({
  caseId,
  isSubmitting,
  onSubmit,
}: {
  caseId: string;
  isSubmitting: boolean;
  onSubmit: (input: MhdRecordCertificationInput) => Promise<void>;
}) {
  const [certType, setCertType] =
    useState<(typeof MHD_LEAVE_CERTIFICATION_TYPES)[number]>('INITIAL');
  const [dueDate, setDueDate] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="certType" className="block text-sm font-medium text-foreground">
            Type
          </label>
          <select
            id="certType"
            value={certType}
            onChange={(event) =>
              setCertType(event.target.value as (typeof MHD_LEAVE_CERTIFICATION_TYPES)[number])
            }
            className={`mt-1 ${INPUT_CLASSES}`}
          >
            {MHD_LEAVE_CERTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatLeaveCertificationType(type)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="certDue" className="block text-sm font-medium text-foreground">
            Due date <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <MhdDateField
            id="certDue"
            value={dueDate}
            onChange={(nextValue) => setDueDate(nextValue)}
            className={`mt-1 ${INPUT_CLASSES}`}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Statutory timelines (15 days to return, 7 to cure, 30-day recertification cadence) are
        tracked here as due dates, not enforced automatically.
      </p>
      <MhdLeaveActionButtons
        submitLabel="Record"
        disabled={isSubmitting}
        onSubmit={() => onSubmit({ caseId, certificationType: certType, dueDate: dueDate || null })}
      />
    </div>
  );
}

function ReviewSufficiencyForm({
  certId,
  isSubmitting,
  onSubmit,
}: {
  certId: string;
  isSubmitting: boolean;
  onSubmit: (input: MhdMarkCertificationInput) => Promise<void>;
}) {
  const { submit, isSubmitting: isSaving } = useMhdLeaveAction();
  const [note, setNote] = useState('');
  const review = (sufficient: boolean) =>
    onSubmit({
      certId,
      sufficient,
      // The provider note is restricted medical detail; it is only ever
      // collected on this PA/HRP-only path and never surfaced elsewhere.
      providerNote: note.trim() || null,
    });

  return (
    <div className="space-y-2">
      <label htmlFor={`note-${certId}`} className="block text-sm font-medium text-foreground">
        Provider note{' '}
        <span className="font-normal text-muted-foreground">(restricted, optional)</span>
      </label>
      <textarea
        id={`note-${certId}`}
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className={`w-full ${INPUT_CLASSES}`}
      />
      <MhdLeaveActionButtons
        submitLabel="Mark Sufficient"
        disabled={isSubmitting}
        onSubmit={() => review(true)}
      >
        <Button
          variant="secondary"
          disabled={isSubmitting || isSaving}
          onClick={() => void submit(() => review(false))}
          className="border-rose-300 text-rose-700"
        >
          Mark Insufficient
        </Button>
      </MhdLeaveActionButtons>
    </div>
  );
}

function CertificationStatusForm({
  certId,
  currentStatus,
  isSubmitting,
  onSubmit,
}: {
  certId: string;
  currentStatus: string | undefined;
  isSubmitting: boolean;
  onSubmit: (input: MhdUpdateCertificationStatusInput) => Promise<void>;
}) {
  // Opens on the case's current status when the workflow record supplies it, and stays blank
  // (a deliberate choice) when it does not.
  const [newStatus, setNewStatus] = useState<MhdLeaveCertificationStatus | ''>(
    MHD_LEAVE_CERTIFICATION_STATUSES.find((status) => status === currentStatus) ?? '',
  );
  const [requestedAt, setRequestedAt] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [deficiencyNotifiedAt, setDeficiencyNotifiedAt] = useState('');
  const [cureDueDate, setCureDueDate] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`status-${certId}`} className="block text-sm font-medium text-foreground">
            Certification status
          </label>
          <select
            id={`status-${certId}`}
            value={newStatus}
            onChange={(event) =>
              setNewStatus(event.target.value as MhdLeaveCertificationStatus | '')
            }
            className={`mt-1 ${INPUT_CLASSES}`}
          >
            <option value="">Select a status</option>
            {MHD_LEAVE_CERTIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`requested-${certId}`}
            className="block text-sm font-medium text-foreground"
          >
            Requested On
          </label>
          <MhdDateField
            id={`requested-${certId}`}
            value={requestedAt}
            onChange={setRequestedAt}
            className={`mt-1 ${INPUT_CLASSES}`}
          />
        </div>
        <div>
          <label
            htmlFor={`received-${certId}`}
            className="block text-sm font-medium text-foreground"
          >
            Received date
          </label>
          <MhdDateField
            id={`received-${certId}`}
            value={receivedAt}
            onChange={setReceivedAt}
            className={`mt-1 ${INPUT_CLASSES}`}
          />
        </div>
        <div>
          <label
            htmlFor={`deficiency-${certId}`}
            className="block text-sm font-medium text-foreground"
          >
            Deficiency notified date
          </label>
          <MhdDateField
            id={`deficiency-${certId}`}
            value={deficiencyNotifiedAt}
            onChange={setDeficiencyNotifiedAt}
            className={`mt-1 ${INPUT_CLASSES}`}
          />
        </div>
        <div>
          <label htmlFor={`cure-${certId}`} className="block text-sm font-medium text-foreground">
            Cure due date
          </label>
          <MhdDateField
            id={`cure-${certId}`}
            value={cureDueDate}
            onChange={setCureDueDate}
            className={`mt-1 ${INPUT_CLASSES}`}
          />
        </div>
      </div>
      <label
        htmlFor={`review-note-${certId}`}
        className="block text-sm font-medium text-foreground"
      >
        Operational note{' '}
        <span className="font-normal text-muted-foreground">
          (optional; no diagnosis or medical detail)
        </span>
      </label>
      <textarea
        id={`review-note-${certId}`}
        rows={2}
        maxLength={2000}
        value={reviewNote}
        onChange={(event) => setReviewNote(event.target.value)}
        className={`w-full ${INPUT_CLASSES}`}
      />
      <p className="text-xs text-muted-foreground">
        A date left blank keeps the date already on record. A cure due date needs a deficiency
        notice date.
      </p>
      <MhdLeaveActionButtons
        submitLabel="Save Status"
        disabled={isSubmitting}
        onSubmit={async () => {
          if (!newStatus) throw new Error('Select the new certification status.');
          await onSubmit({
            certId,
            status: newStatus,
            receivedAt: receivedAt || null,
            deficiencyNotifiedAt: deficiencyNotifiedAt || null,
            cureDueDate: cureDueDate || null,
            reviewNote: reviewNote.trim() || null,
            requestedAt: requestedAt || null,
          });
        }}
      />
    </div>
  );
}

function ClearDatesForm({
  certificationId,
  isSubmitting,
  onSubmit,
}: {
  certificationId: string;
  isSubmitting: boolean;
  onSubmit: (input: MhdLeaveCertificationClearDatesInput) => Promise<void>;
}) {
  const [fields, setFields] = useState<MhdLeaveCertificationClearableDate[]>([]);
  const [reason, setReason] = useState('');

  function toggleField(field: MhdLeaveCertificationClearableDate, checked: boolean) {
    setFields((current) =>
      checked ? [...current, field] : current.filter((item) => item !== field),
    );
  }

  return (
    <div className="space-y-2">
      <fieldset>
        <legend className="text-sm font-medium text-foreground">Dates To Clear</legend>
        {MHD_LEAVE_CERTIFICATION_CLEARABLE_DATES.map((field) => (
          <label key={field} className="mt-1 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fields.includes(field)}
              onChange={(event) => toggleField(field, event.target.checked)}
            />
            {CLEARABLE_DATE_LABELS[field]}
          </label>
        ))}
      </fieldset>
      <label
        htmlFor={`clear-reason-${certificationId}`}
        className="block text-sm font-medium text-foreground"
      >
        Reason for clearing
      </label>
      <textarea
        id={`clear-reason-${certificationId}`}
        rows={2}
        maxLength={2000}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className={`w-full ${INPUT_CLASSES}`}
      />
      <MhdLeaveActionButtons
        submitLabel="Clear Dates"
        disabled={isSubmitting || fields.length === 0 || !reason.trim()}
        onSubmit={() => onSubmit({ certificationId, fields, reason })}
      />
    </div>
  );
}

/**
 * Status and deficiency dates are operational tracking, not medical content, so they are
 * shown to everyone who can read the workflow, unlike the provider note above.
 */
function MhdCertificationOperationalFacts({
  facts,
}: {
  facts: MhdLeaveWorkflow['certifications'][number];
}) {
  return (
    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 text-xs text-muted-foreground">
      <dt>Status</dt>
      <dd className="text-foreground">{facts.status.replaceAll('_', ' ')}</dd>
      {facts.requested_at ? (
        <>
          <dt>Requested</dt>
          <dd className="text-foreground">{facts.requested_at}</dd>
        </>
      ) : null}
      {facts.deficiency_notified_at ? (
        <>
          <dt>Deficiency notified</dt>
          <dd className="text-foreground">{facts.deficiency_notified_at}</dd>
        </>
      ) : null}
      {facts.cure_due_date ? (
        <>
          <dt>Cure due</dt>
          <dd className="text-foreground">{facts.cure_due_date}</dd>
        </>
      ) : null}
    </dl>
  );
}
