import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdInvestigationCaseFormSchema, type MhdInvestigationCaseFormValues } from '../Schemas';
import {
  MHD_INVESTIGATION_CASE_TYPES,
  MHD_INVESTIGATION_CONFIDENTIALITIES,
  mhdFormatInvestigationCaseType,
  mhdFormatInvestigationConfidentiality,
} from '../Types';

interface UserOption {
  id: string;
  displayName: string;
}

interface Props {
  companyId: string;
  /** Candidate investigators (the company's people roster). Optional selection. */
  investigators: UserOption[];
  onSubmit: (values: MhdInvestigationCaseFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Opens an investigation case.
 *
 * The allegation narrative is captured here and is the field encrypted at rest
 * (server-side, via `mhd_encrypt_field_value` on create) — it never sits as
 * plaintext in a column. Assigning an investigator on create is optional; if
 * chosen, that user receives an implicit grant so they can see the case. The
 * creator is always granted automatically. Confidentiality defaults to STANDARD.
 */
export function MhdInvestigationCaseForm({
  companyId,
  investigators,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdInvestigationCaseFormValues>({
    resolver: zodResolver(mhdInvestigationCaseFormSchema),
    defaultValues: {
      companyId,
      caseType: 'COMPLAINT',
      allegation: '',
      assignedInvestigator: null,
      severity: null,
      confidentiality: 'STANDARD',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />

      <div>
        <label htmlFor="caseType" className="block text-sm font-medium text-foreground">
          Case type
        </label>
        <select
          id="caseType"
          {...register('caseType')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {MHD_INVESTIGATION_CASE_TYPES.map((type) => (
            <option key={type} value={type}>
              {mhdFormatInvestigationCaseType(type)}
            </option>
          ))}
        </select>
        {errors.caseType ? (
          <p className="mt-1 text-xs text-rose-600">{errors.caseType.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="allegation" className="block text-sm font-medium text-foreground">
          Allegation
        </label>
        <textarea
          id="allegation"
          rows={5}
          {...register('allegation')}
          placeholder="What is being alleged, in the reporter's words."
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {/* This narrative is encrypted at rest and only ever read back through the
            audited reveal path — it is the most sensitive text in the system. */}
        <p className="mt-1 text-xs text-muted-foreground">
          Encrypted at rest. It is read back only through the audited reveal, never shown by
          default.
        </p>
        {errors.allegation ? (
          <p className="mt-1 text-xs text-rose-600">{errors.allegation.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="assignedInvestigator"
            className="block text-sm font-medium text-foreground"
          >
            Assigned investigator{' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id="assignedInvestigator"
            {...register('assignedInvestigator')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {investigators.map((user) => (
              <option key={user.id} value={user.id}>
                {user.displayName}
              </option>
            ))}
          </select>
          {/* Assigning grants the investigator an implicit view of the case. */}
          <p className="mt-1 text-xs text-muted-foreground">
            The investigator is granted access on assignment.
          </p>
        </div>

        <div>
          <label htmlFor="confidentiality" className="block text-sm font-medium text-foreground">
            Confidentiality
          </label>
          <select
            id="confidentiality"
            {...register('confidentiality')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {MHD_INVESTIGATION_CONFIDENTIALITIES.map((level) => (
              <option key={level} value={level}>
                {mhdFormatInvestigationConfidentiality(level)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="severity" className="block text-sm font-medium text-foreground">
          Severity <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="severity"
          type="text"
          {...register('severity')}
          placeholder="e.g. Low, Moderate, High"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          Cancel
        </button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Opening…' : 'Open investigation'}
        </Button>
      </div>
    </form>
  );
}
