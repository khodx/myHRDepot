import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdConductActionFormSchema, type MhdConductActionFormSchemaInput } from '../Schemas';
import { MHD_CONDUCT_SEVERITIES, type MhdConductAction, mhdFormatConductSeverity } from '../Types';

interface Props {
  mode: 'create' | 'edit';
  /** Present in edit mode — the draft action being amended. */
  initial?: MhdConductAction;
  onSubmit: (input: MhdConductActionFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function MhdPayloadInput({
  id,
  label,
  registration,
  placeholder,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded border px-3 py-2"
        placeholder={placeholder}
        {...registration}
      />
    </div>
  );
}

function MhdPayloadTextarea({
  id,
  label,
  registration,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        className="w-full rounded border px-3 py-2"
        rows={rows}
        placeholder={placeholder}
        {...registration}
      />
    </div>
  );
}

/**
 * Compose or amend a corrective action while it is still DRAFT. Severity picks
 * the escalation rung (which the ceremony maps to a document template); the
 * summary is the narrative that renders into the document. `requiresDocument`
 * decides whether issuing runs the Doc-Gen -> E-Signature ceremony or issues a
 * bare record. Once ISSUED the action is immutable except its outcome — the
 * server refuses edits, so this form is only reachable for drafts.
 */
export function MhdConductActionForm({ mode, initial, onSubmit, onCancel, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdConductActionFormSchemaInput>({
    resolver: zodResolver(mhdConductActionFormSchema),
    defaultValues: initial
      ? {
          severity: initial.severity,
          actionSummary: initial.actionSummary ?? undefined,
          documentPayload: initial.documentPayload,
          requiresDocument: initial.requiresDocument,
        }
      : {
          severity: 'WRITTEN_WARNING',
          documentPayload: {},
          requiresDocument: true,
        },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="mhd-conduct-action-severity" className="mb-1 block text-sm font-medium">
          Severity
        </label>
        <select
          id="mhd-conduct-action-severity"
          className="w-full rounded border px-3 py-2"
          {...register('severity')}
        >
          {MHD_CONDUCT_SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {mhdFormatConductSeverity(severity)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          The rung on the escalation ladder. It selects the corrective-action document template.
        </p>
        {errors.severity ? (
          <p className="mt-1 text-xs text-red-600">{errors.severity.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="mhd-conduct-action-summary" className="mb-1 block text-sm font-medium">
          Action Summary
        </label>
        <textarea
          id="mhd-conduct-action-summary"
          className="w-full rounded border px-3 py-2"
          rows={4}
          placeholder="What the action states — the narrative that renders into the document. Sensitive; privileged roles only."
          {...register('actionSummary')}
        />
        {errors.actionSummary ? (
          <p className="mt-1 text-xs text-red-600">{errors.actionSummary.message}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Notice Layout Fields</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          These fields feed the generated corrective-action notice. Drafts can be amended; issued
          actions freeze this content with the document.
        </p>

        <MhdFormFieldStack className="mt-4">
          <MhdPayloadInput
            id="mhd-conduct-payload-company"
            label="Company Name"
            registration={register('documentPayload.companyName')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-position"
            label="Position/Title"
            registration={register('documentPayload.positionTitle')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-department"
            label="Department/Program"
            registration={register('documentPayload.departmentProgram')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-supervisor"
            label="Supervisor"
            registration={register('documentPayload.supervisorName')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-location"
            label="Facility/Location"
            registration={register('documentPayload.facilityLocation')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-hire-date"
            label="Date of Hire"
            registration={register('documentPayload.dateOfHire')}
            placeholder="Tuesday, June 22, 2026"
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-notice-date"
            label="Date of Notice"
            registration={register('documentPayload.dateOfNotice')}
            placeholder="Tuesday, June 22, 2026"
          />
        </MhdFormFieldStack>

        <MhdFormFieldStack className="mt-4">
          <MhdPayloadInput
            id="mhd-conduct-payload-incident-dates"
            label="Date(s) of Incident"
            registration={register('documentPayload.incidentDates')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-incident-time"
            label="Time of Incident"
            registration={register('documentPayload.incidentTime')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-incident-location"
            label="Location of Incident"
            registration={register('documentPayload.incidentLocation')}
          />
          <MhdPayloadInput
            id="mhd-conduct-payload-previously-addressed"
            label="Previously Addressed"
            registration={register('documentPayload.previouslyAddressed')}
            placeholder="Yes / No"
          />
        </MhdFormFieldStack>

        <div className="mt-4 space-y-3">
          <MhdPayloadTextarea
            id="mhd-conduct-payload-policies"
            label="Policy/Procedure Violated"
            registration={register('documentPayload.policiesViolated')}
            placeholder="One policy per line."
          />
          <MhdPayloadTextarea
            id="mhd-conduct-payload-narrative"
            label="Description of Incident"
            registration={register('documentPayload.incidentNarrative')}
            rows={5}
          />
          <MhdPayloadTextarea
            id="mhd-conduct-payload-findings"
            label="Documented Facts / Findings"
            registration={register('documentPayload.incidentFindings')}
            rows={5}
            placeholder="Use one fact per line for source-style bullets."
          />
          <MhdPayloadTextarea
            id="mhd-conduct-payload-policy-citation"
            label="Policy Citation Text"
            registration={register('documentPayload.policyCitationText')}
            rows={4}
          />
          <MhdPayloadTextarea
            id="mhd-conduct-payload-history"
            label="Prior Corrective Action History"
            registration={register('documentPayload.priorCorrectiveActionSummary')}
          />
          <MhdPayloadTextarea
            id="mhd-conduct-payload-training"
            label="Mandatory Training / Required Steps"
            registration={register('documentPayload.trainingItems')}
            placeholder="One requirement per line."
          />
          <MhdFormFieldStack>
            <MhdPayloadInput
              id="mhd-conduct-payload-training-deadline"
              label="Training/Completion Deadline"
              registration={register('documentPayload.trainingDeadline')}
            />
            <MhdPayloadInput
              id="mhd-conduct-payload-follow-up"
              label="Follow-Up Review Date"
              registration={register('documentPayload.followUpReviewDate')}
            />
          </MhdFormFieldStack>
          <MhdPayloadTextarea
            id="mhd-conduct-payload-expectations"
            label="Expectations"
            registration={register('documentPayload.expectations')}
            rows={4}
          />
          <MhdPayloadTextarea
            id="mhd-conduct-payload-consequences"
            label="Consequences of Failure to Improve"
            registration={register('documentPayload.consequencesText')}
            rows={4}
          />
          <MhdFormFieldStack>
            <MhdPayloadInput
              id="mhd-conduct-payload-extenuating-considered"
              label="Extenuating Circumstances Considered"
              registration={register('documentPayload.extenuatingCircumstancesConsidered')}
              placeholder="Yes / No"
            />
            <MhdPayloadTextarea
              id="mhd-conduct-payload-extenuating-explanation"
              label="Extenuating Circumstances Explanation"
              registration={register('documentPayload.extenuatingCircumstancesExplanation')}
            />
          </MhdFormFieldStack>
        </div>
      </div>

      {mode === 'create' ? (
        <div className="flex items-start gap-2">
          <input
            id="mhd-conduct-action-requires-document"
            type="checkbox"
            className="mt-1"
            defaultChecked
            {...register('requiresDocument')}
          />
          <label htmlFor="mhd-conduct-action-requires-document" className="text-sm">
            Generate a signable document
            <span className="mt-0.5 block text-xs text-muted-foreground">
              When on, issuing renders the template and routes it to the employee for acknowledgment
              of receipt. When off, the action is recorded without a document.
            </span>
          </label>
        </div>
      ) : (
        // requiresDocument is fixed after creation — the immutability trigger freezes
        // it once issued, and changing it on a draft would desync the ceremony intent.
        <p className="text-xs text-muted-foreground">
          {initial?.requiresDocument
            ? 'This action generates a signable document when issued.'
            : 'This action is recorded without a document.'}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Add Action' : 'Save Changes'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
