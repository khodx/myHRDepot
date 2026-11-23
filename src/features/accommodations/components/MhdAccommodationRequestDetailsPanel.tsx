import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import { mhdAccommodationRequestDetailsSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_CERTIFICATION_METHODS,
  MHD_ACCOMMODATION_LIMITATION_DURATIONS,
  mhdFormatAccommodationValue,
  type MhdAccommodationCertificationMethod,
  type MhdAccommodationLimitationDuration,
  type MhdAccommodationRequestDetails,
  type MhdAccommodationRequestDetailsInput,
  type MhdAccommodationStatus,
} from '../Types';
import { MhdAccommodationDraftModal } from './MhdAccommodationDraftModal';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:bg-muted';

/** Display wording for the certification methods; keyed by the shared union so it cannot drift. */
const CERTIFICATION_METHOD_LABELS: Record<MhdAccommodationCertificationMethod, string> = {
  SELF_SERVICE: 'Self-Service',
  IN_PERSON_PAPER: 'In-Person Paper',
  E_SIGNATURE: 'E-Signature',
};

/** Methods an administrator records on the employee's behalf (self-service is the employee's own act). */
const ADMINISTRATOR_CERTIFICATION_METHODS = MHD_ACCOMMODATION_CERTIFICATION_METHODS.filter(
  (method) => method !== 'SELF_SERVICE',
);

type DetailsField =
  | 'caseId'
  | 'limitationDuration'
  | 'anticipatedRecoveryDate'
  | 'workersCompClaim'
  | 'workersCompClaimFiledOn'
  | 'leaveRequested'
  | 'leaveRequestDetails'
  | 'contactPhone'
  | 'contactEmail'
  | 'workLocation'
  | 'supervisorName';

interface MhdAccommodationRequestDetailsPanelProps {
  caseId: string;
  /** The case's company, stamped on any draft saved from the modals. */
  companyId: string | null;
  details: MhdAccommodationRequestDetails | null;
  caseStatus: MhdAccommodationStatus;
  /** The signed-in person is the subject of this case. */
  isOwnCase: boolean;
  /** mhdAccommodationsIsPrivileged: administrators edit after certification and record paper or e-signature certifications. */
  canAdminister: boolean;
  onSave: (input: MhdAccommodationRequestDetailsInput) => Promise<unknown>;
  onCertify: (method: MhdAccommodationCertificationMethod) => Promise<unknown>;
  isPending: boolean;
}

function YesNoField({
  name,
  legend,
  value,
  disabled,
  onChange,
}: {
  name: string;
  legend: string;
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            checked={value}
            disabled={disabled}
            onChange={() => onChange(true)}
          />
          Yes
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            checked={!value}
            disabled={disabled}
            onChange={() => onChange(false)}
          />
          No
        </label>
      </div>
    </fieldset>
  );
}

/**
 * Section A of the accommodation package: non-medical dates, flags and contact facts. The employee
 * completes their own request and certifies it once; after that the form is read-only for them,
 * while administrators can still correct it. A closed case is read-only for everyone (the RPC
 * refuses edits until the case is reopened).
 */
export function MhdAccommodationRequestDetailsPanel({
  caseId,
  companyId,
  details,
  caseStatus,
  isOwnCase,
  canAdminister,
  onSave,
  onCertify,
  isPending,
}: MhdAccommodationRequestDetailsPanelProps) {
  const certified = Boolean(details?.employee_certified_at);
  const isClosed = caseStatus === 'CLOSED';
  const canEdit = !isClosed && (canAdminister || (isOwnCase && !certified));

  const [limitationDuration, setLimitationDuration] = useState<
    MhdAccommodationLimitationDuration | ''
  >(details?.limitation_duration ?? '');
  const [anticipatedRecoveryDate, setAnticipatedRecoveryDate] = useState(
    details?.anticipated_recovery_date ?? '',
  );
  const [workersCompClaim, setWorkersCompClaim] = useState(details?.workers_comp_claim ?? false);
  const [workersCompClaimFiledOn, setWorkersCompClaimFiledOn] = useState(
    details?.workers_comp_claim_filed_on ?? '',
  );
  const [leaveRequested, setLeaveRequested] = useState(details?.leave_requested ?? false);
  const [leaveRequestDetails, setLeaveRequestDetails] = useState(
    details?.leave_request_details ?? '',
  );
  const [contactPhone, setContactPhone] = useState(details?.contact_phone ?? '');
  const [contactEmail, setContactEmail] = useState(details?.contact_email ?? '');
  const [workLocation, setWorkLocation] = useState(details?.work_location ?? '');
  const [supervisorName, setSupervisorName] = useState(details?.supervisor_name ?? '');
  const [certificationMethod, setCertificationMethod] =
    useState<MhdAccommodationCertificationMethod>(ADMINISTRATOR_CERTIFICATION_METHODS[0]);
  const [errors, setErrors] = useState<Partial<Record<DetailsField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [recordingCertification, setRecordingCertification] = useState(false);

  // The limitation duration and recovery date describe the condition itself, so they stay out of
  // the draft; the rest of Section A is work-related contact and leave facts.
  function getDraftValues() {
    return {
      workersCompClaim,
      workersCompClaimFiledOn,
      leaveRequested,
      leaveRequestDetails,
      contactPhone,
      contactEmail,
      workLocation,
      supervisorName,
    };
  }

  function restoreDraft(payload: Record<string, unknown>) {
    const text = (value: unknown) => (typeof value === 'string' ? value : '');
    setWorkersCompClaim(payload.workersCompClaim === true);
    setWorkersCompClaimFiledOn(text(payload.workersCompClaimFiledOn));
    setLeaveRequested(payload.leaveRequested === true);
    setLeaveRequestDetails(text(payload.leaveRequestDetails));
    setContactPhone(text(payload.contactPhone));
    setContactEmail(text(payload.contactEmail));
    setWorkLocation(text(payload.workLocation));
    setSupervisorName(text(payload.supervisorName));
  }

  /** Resolves false when the schema refuses the entries; a server refusal is thrown to the modal. */
  async function handleSave() {
    setFormError(null);
    const parsed = mhdAccommodationRequestDetailsSchema.safeParse({
      caseId,
      limitationDuration: limitationDuration || null,
      anticipatedRecoveryDate: anticipatedRecoveryDate || null,
      workersCompClaim,
      workersCompClaimFiledOn: workersCompClaim ? workersCompClaimFiledOn || null : null,
      leaveRequested,
      leaveRequestDetails: leaveRequested ? leaveRequestDetails.trim() || null : null,
      contactPhone: contactPhone.trim() || null,
      contactEmail: contactEmail.trim(),
      workLocation: workLocation.trim() || null,
      supervisorName: supervisorName.trim() || null,
    });
    if (!parsed.success) {
      const nextErrors: Partial<Record<DetailsField, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as DetailsField;
        nextErrors[field] = nextErrors[field] ?? issue.message;
      }
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return onSave({
      caseId,
      limitationDuration: parsed.data.limitationDuration ?? null,
      anticipatedRecoveryDate: parsed.data.anticipatedRecoveryDate ?? null,
      workersCompClaim: parsed.data.workersCompClaim,
      workersCompClaimFiledOn: parsed.data.workersCompClaimFiledOn ?? null,
      leaveRequested: parsed.data.leaveRequested,
      leaveRequestDetails: parsed.data.leaveRequestDetails ?? null,
      contactPhone: parsed.data.contactPhone ?? null,
      contactEmail: parsed.data.contactEmail || null,
      workLocation: parsed.data.workLocation ?? null,
      supervisorName: parsed.data.supervisorName ?? null,
      supervisorPersonId: details?.supervisor_person_id ?? null,
    });
  }

  async function handleCertify(method: MhdAccommodationCertificationMethod) {
    setFormError(null);
    try {
      await onCertify(method);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : 'The certification was not recorded.',
      );
    }
  }

  function fieldError(field: DetailsField) {
    return errors[field] ? <p className="mt-1 text-xs text-rose-700">{errors[field]}</p> : null;
  }

  const disabled = isPending;
  const showSelfCertify = isOwnCase && !certified && !isClosed;
  const showAdminCertify = canAdminister && !isOwnCase && !certified && !isClosed;

  return (
    <MhdCard className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MhdCardHeader title="Request Details" className="mb-0" />
        {canEdit ? (
          <Button
            variant="secondary"
            onClick={() => {
              setFormError(null);
              setEditing(true);
            }}
          >
            Edit Request Details
          </Button>
        ) : null}
      </div>
      {formError ? (
        <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{formError}</p>
      ) : null}
      {isClosed ? (
        <p className="text-sm text-muted-foreground">
          This case is closed. Reopen it to change the request details.
        </p>
      ) : null}
      {!isClosed && certified && !canAdminister ? (
        <p className="text-sm text-muted-foreground">
          You certified this request. Contact Human Resources to change it.
        </p>
      ) : null}

      <dl className="grid gap-3 md:grid-cols-2">
        <MhdDetailField
          label="Limitation"
          value={
            details?.limitation_duration
              ? mhdFormatAccommodationValue(details.limitation_duration)
              : null
          }
        />
        <MhdDetailField
          label="Anticipated Recovery Date"
          value={details?.anticipated_recovery_date}
        />
        <MhdDetailField
          label="Workers' Compensation Claim"
          value={details ? (details.workers_comp_claim ? 'Yes' : 'No') : null}
        />
        <MhdDetailField label="Claim Filed On" value={details?.workers_comp_claim_filed_on} />
        <MhdDetailField
          label="Leave Requested"
          value={details ? (details.leave_requested ? 'Yes' : 'No') : null}
        />
        <MhdDetailField label="Leave Request Details" value={details?.leave_request_details} />
        <MhdDetailField label="Contact Phone" value={details?.contact_phone} />
        <MhdDetailField label="Contact Email" value={details?.contact_email} />
        <MhdDetailField label="Work Location" value={details?.work_location} />
        <MhdDetailField label="Supervisor Name" value={details?.supervisor_name} />
      </dl>

      {editing && canEdit ? (
        <MhdAccommodationDraftModal
          title="Edit Request Details"
          description="Work-related facts only. Do not enter a diagnosis, cause, genetic information, or medical records."
          draftKey={`${caseId}:request-details`}
          companyId={companyId}
          getDraftValues={getDraftValues}
          onRestore={restoreDraft}
          excludesMedical
          submitLabel="Save Request Details"
          pendingLabel="Saving…"
          isSubmitting={isPending}
          onSubmit={handleSave}
          onClose={() => setEditing(false)}
        >
          {errors.caseId ? <p className="text-sm text-rose-700">{errors.caseId}</p> : null}
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Limitation</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {MHD_ACCOMMODATION_LIMITATION_DURATIONS.map((value) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`mhd-request-limitation-${caseId}`}
                    value={value}
                    checked={limitationDuration === value}
                    disabled={disabled}
                    onChange={() => {
                      setLimitationDuration(value);
                      if (value !== 'TEMPORARY') setAnticipatedRecoveryDate('');
                    }}
                  />
                  {mhdFormatAccommodationValue(value)}
                </label>
              ))}
            </div>
            {fieldError('limitationDuration')}
          </fieldset>
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-request-recovery-date">
              Anticipated Recovery Date
            </label>
            <MhdDateField
              id="mhd-request-recovery-date"
              className={`mt-1 ${inputClass}`}
              value={anticipatedRecoveryDate}
              disabled={disabled || limitationDuration !== 'TEMPORARY'}
              onChange={setAnticipatedRecoveryDate}
            />
            {fieldError('anticipatedRecoveryDate')}
          </div>

          <YesNoField
            name={`mhd-request-workers-comp-${caseId}`}
            legend="Workers' Compensation Claim"
            value={workersCompClaim}
            disabled={disabled}
            onChange={(next) => {
              setWorkersCompClaim(next);
              if (!next) setWorkersCompClaimFiledOn('');
            }}
          />
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-request-workers-comp-filed">
              Claim Filed On
            </label>
            <MhdDateField
              id="mhd-request-workers-comp-filed"
              className={`mt-1 ${inputClass}`}
              value={workersCompClaimFiledOn}
              disabled={disabled || !workersCompClaim}
              onChange={setWorkersCompClaimFiledOn}
            />
            {fieldError('workersCompClaimFiledOn')}
          </div>

          <YesNoField
            name={`mhd-request-leave-${caseId}`}
            legend="Leave Requested"
            value={leaveRequested}
            disabled={disabled}
            onChange={(next) => {
              setLeaveRequested(next);
              if (!next) setLeaveRequestDetails('');
            }}
          />
          <div>
            <label className="block text-sm font-medium" htmlFor="mhd-request-leave-details">
              Leave Request Details
            </label>
            <textarea
              id="mhd-request-leave-details"
              className={`mt-1 min-h-16 ${inputClass}`}
              value={leaveRequestDetails}
              disabled={disabled || !leaveRequested}
              placeholder="What leave was requested, and for which dates"
              onChange={(event) => setLeaveRequestDetails(event.target.value)}
            />
            {fieldError('leaveRequestDetails')}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="mhd-request-contact-phone">
                Contact Phone
              </label>
              <input
                id="mhd-request-contact-phone"
                type="tel"
                className={`mt-1 ${inputClass}`}
                value={contactPhone}
                disabled={disabled}
                onChange={(event) => setContactPhone(event.target.value)}
              />
              {fieldError('contactPhone')}
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="mhd-request-contact-email">
                Contact Email
              </label>
              <input
                id="mhd-request-contact-email"
                type="email"
                className={`mt-1 ${inputClass}`}
                value={contactEmail}
                disabled={disabled}
                onChange={(event) => setContactEmail(event.target.value)}
              />
              {fieldError('contactEmail')}
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="mhd-request-work-location">
                Work Location
              </label>
              <input
                id="mhd-request-work-location"
                className={`mt-1 ${inputClass}`}
                value={workLocation}
                disabled={disabled}
                onChange={(event) => setWorkLocation(event.target.value)}
              />
              {fieldError('workLocation')}
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="mhd-request-supervisor-name">
                Supervisor Name
              </label>
              <input
                id="mhd-request-supervisor-name"
                className={`mt-1 ${inputClass}`}
                value={supervisorName}
                disabled={disabled}
                onChange={(event) => setSupervisorName(event.target.value)}
              />
              {fieldError('supervisorName')}
            </div>
          </div>
        </MhdAccommodationDraftModal>
      ) : null}

      <div className="space-y-2 border-t border-border pt-4">
        <MhdCardHeader title="Employee Certification" />
        {certified && details?.employee_certified_at ? (
          <p className="text-sm">
            Certified {new Date(details.employee_certified_at).toLocaleDateString()}
            {details.employee_certified_method
              ? ` · ${CERTIFICATION_METHOD_LABELS[details.employee_certified_method]}`
              : ''}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Not certified yet.</p>
        )}
        {showSelfCertify ? (
          <div className="space-y-1">
            <Button
              disabled={isPending || !details}
              onClick={() => void handleCertify('SELF_SERVICE')}
            >
              I Certify That I Have A Disability That Requires Reasonable Accommodation
            </Button>
            {!details ? (
              <p className="text-xs text-muted-foreground">
                Save your request details before certifying them.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                You can certify once. After that, only Human Resources can change these details.
              </p>
            )}
          </div>
        ) : null}
        {showAdminCertify ? (
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setFormError(null);
              setRecordingCertification(true);
            }}
          >
            Record Employee Certification
          </Button>
        ) : null}
        {recordingCertification && showAdminCertify ? (
          <MhdAccommodationDraftModal
            title="Record Employee Certification"
            description="Record a certification the employee completed on paper or by e-signature."
            size="md"
            draftKey={`${caseId}:certification`}
            companyId={companyId}
            getDraftValues={() => ({ certificationMethod })}
            onRestore={(payload) => {
              if (
                ADMINISTRATOR_CERTIFICATION_METHODS.includes(payload.certificationMethod as never)
              ) {
                setCertificationMethod(
                  payload.certificationMethod as MhdAccommodationCertificationMethod,
                );
              }
            }}
            submitLabel="Save Certification"
            isSubmitting={isPending}
            onSubmit={() => onCertify(certificationMethod)}
            onClose={() => setRecordingCertification(false)}
          >
            <label className="block text-sm font-medium">
              Certification Method
              <select
                className={`mt-1 ${inputClass}`}
                value={certificationMethod}
                onChange={(event) =>
                  setCertificationMethod(event.target.value as MhdAccommodationCertificationMethod)
                }
              >
                {ADMINISTRATOR_CERTIFICATION_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {CERTIFICATION_METHOD_LABELS[method]}
                  </option>
                ))}
              </select>
            </label>
          </MhdAccommodationDraftModal>
        ) : null}
      </div>
    </MhdCard>
  );
}

export default MhdAccommodationRequestDetailsPanel;
