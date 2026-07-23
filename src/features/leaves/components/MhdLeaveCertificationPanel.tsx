import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import {
  MHD_LEAVE_CERTIFICATION_TYPES,
  mhdFormatLeaveCertificationType,
  type MhdLeaveCertification,
  type MhdMarkCertificationInput,
  type MhdRecordCertificationInput,
} from '../Types';

interface Props {
  caseId: string;
  certifications: MhdLeaveCertification[];
  /**
   * Whether this viewer is Platform Admin or HR Partner. Passed from the ROUTE,
   * not inferred from the rows — the rows cannot answer it, see below.
   */
  canSeeMedical: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  onRecord: (input: MhdRecordCertificationInput) => Promise<void>;
  onMarkSufficient: (input: MhdMarkCertificationInput) => Promise<void>;
}

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
 */
export function MhdLeaveCertificationPanel({
  caseId,
  certifications,
  canSeeMedical,
  isLoading = false,
  isSubmitting = false,
  onRecord,
  onMarkSufficient,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [certType, setCertType] =
    useState<(typeof MHD_LEAVE_CERTIFICATION_TYPES)[number]>('INITIAL');
  const [dueDate, setDueDate] = useState('');

  // Per-row review state (mark sufficient / insufficient + optional note). Only
  // ever shown to a PA/HRP viewer.
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  async function submitRecord() {
    await onRecord({
      caseId,
      certificationType: certType,
      dueDate: dueDate || null,
    });
    setIsRecording(false);
    setDueDate('');
    setCertType('INITIAL');
  }

  async function submitReview(certId: string, sufficient: boolean) {
    await onMarkSufficient({
      certId,
      sufficient,
      // The provider note is restricted medical detail; it is only ever
      // collected on this PA/HRP-only path and never surfaced elsewhere.
      providerNote: note.trim() || null,
    });
    setReviewingId(null);
    setNote('');
  }

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
          <Button variant="secondary" onClick={() => setIsRecording(true)}>
            Record certification
          </Button>
        ) : null}
      </div>

      {isRecording && canSeeMedical ? (
        <MhdCard className="space-y-3">
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
              <input
                id="certDue"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={`mt-1 ${INPUT_CLASSES}`}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Statutory timelines (15 days to return, 7 to cure, 30-day recertification cadence) are
            tracked here as due dates, not enforced automatically.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsRecording(false)}>
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void submitRecord()}>
              {isSubmitting ? 'Saving…' : 'Record'}
            </Button>
          </div>
        </MhdCard>
      ) : null}

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
                reviewingId === cert.id ? (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <label
                      htmlFor={`note-${cert.id}`}
                      className="block text-sm font-medium text-foreground"
                    >
                      Provider note{' '}
                      <span className="font-normal text-muted-foreground">
                        (restricted, optional)
                      </span>
                    </label>
                    <textarea
                      id={`note-${cert.id}`}
                      rows={2}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className={`w-full ${INPUT_CLASSES}`}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setReviewingId(null);
                          setNote('');
                        }}
                      >
                        Cancel
                      </Button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void submitReview(cert.id, false)}
                        className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 disabled:opacity-50"
                      >
                        Mark insufficient
                      </button>
                      <Button
                        disabled={isSubmitting}
                        onClick={() => void submitReview(cert.id, true)}
                      >
                        {isSubmitting ? 'Saving…' : 'Mark sufficient'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingId(cert.id);
                      setNote('');
                    }}
                    className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
                  >
                    Review sufficiency
                  </button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
