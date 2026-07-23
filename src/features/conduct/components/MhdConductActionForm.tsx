import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdConductActionFormSchema, type MhdConductActionFormSchemaInput } from '../Schemas';
import {
  MHD_CONDUCT_SEVERITIES,
  type MhdConductAction,
  mhdFormatConductSeverity,
} from '../Types';

interface Props {
  mode: 'create' | 'edit';
  /** Present in edit mode — the draft action being amended. */
  initial?: MhdConductAction;
  onSubmit: (input: MhdConductActionFormSchemaInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
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
          requiresDocument: initial.requiresDocument,
        }
      : {
          severity: 'WRITTEN_WARNING',
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
        {errors.severity ? <p className="mt-1 text-xs text-red-600">{errors.severity.message}</p> : null}
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
        {errors.actionSummary ? <p className="mt-1 text-xs text-red-600">{errors.actionSummary.message}</p> : null}
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
              When on, issuing renders the template and routes it to the employee for acknowledgment of receipt.
              When off, the action is recorded without a document.
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
