import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { mhdRejectApplicationSchema, type MhdRejectApplicationFormValues } from '../Schemas';
import type { MhdRecruitingReason } from '../Types';

// Structural shape — satisfied by both the list projection
// (`MhdRecruitingApplication`) and the full record (`MhdRecruitingApplicationDetail`),
// so the dialog serves the pipeline board and the detail page alike.
interface RejectableApplication {
  id: string;
  referenceId: string;
  personDisplayName: string;
}

interface Props {
  application: RejectableApplication;
  /** Configurable reasons from `reason_list` (global + company). */
  reasons: MhdRecruitingReason[];
  onSubmit: (values: MhdRejectApplicationFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * The inline rejection dialog — a REASON PICKER plus an optional note, never a
 * `window.prompt` / `window.confirm`. Rejection is a first-class terminal
 * outcome (`application_reject`): it sets lifecycle REJECTED and records the
 * reason, independent of moving to a REJECTED stage. Both reason and note are
 * optional at the RPC; the dialog nudges toward a reason for an auditable trail.
 */
export function MhdRejectDialog({
  application,
  reasons,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdRejectApplicationFormValues>({
    resolver: zodResolver(mhdRejectApplicationSchema),
    defaultValues: {
      applicationId: application.id,
      reasonId: '',
      note: '',
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Reject application</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {application.personDisplayName} · {application.referenceId}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <input type="hidden" {...register('applicationId')} readOnly />

          <div>
            <label htmlFor="reasonId" className="block text-sm font-medium text-foreground">
              Reason <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <select
              id="reasonId"
              {...register('reasonId')}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">No reason selected</option>
              {reasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.reasonText}
                </option>
              ))}
            </select>
            {errors.reasonId ? (
              <p className="mt-1 text-xs text-rose-600">{errors.reasonId.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-foreground">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="note"
              rows={3}
              {...register('note')}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
            />
            {errors.note ? (
              <p className="mt-1 text-xs text-rose-600">{errors.note.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Rejecting…' : 'Reject application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
