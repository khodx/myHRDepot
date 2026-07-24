import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mhdReturnPropertySchema, type MhdReturnPropertySchemaInput } from '../Schemas';
import type { MhdPropertyAssignment } from '../Types';

interface MhdPropertyReturnFormProps {
  assignment: MhdPropertyAssignment;
  isSubmitting: boolean;
  onSubmit: (input: MhdReturnPropertySchemaInput) => Promise<void>;
  onCancel: () => void;
}

export function MhdPropertyReturnForm({
  assignment,
  isSubmitting,
  onSubmit,
  onCancel,
}: MhdPropertyReturnFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdReturnPropertySchemaInput>({
    resolver: zodResolver(mhdReturnPropertySchema),
    defaultValues: {
      receiverTitle: assignment.receiverTitle,
      returnConditionNotes: assignment.returnConditionNotes,
      returnAckReturned: false,
      returnAckMaintained: false,
      returnAckLiability: false,
      employeeReturnSignatureName: '',
    },
  });

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Record Return</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignment.itemName} assigned to {assignment.personDisplayName}
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Receiver Title</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('receiverTitle')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Condition at Return
          </label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('returnConditionNotes')}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          Employee Acknowledgment
        </legend>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('returnAckReturned')} />I acknowledge
          that I have returned the assigned company property.
        </label>
        {errors.returnAckReturned ? (
          <p className="text-xs text-red-600">{errors.returnAckReturned.message}</p>
        ) : null}

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('returnAckMaintained')} />I confirm
          that I have maintained the company property in accordance with company standards.
        </label>
        {errors.returnAckMaintained ? (
          <p className="text-xs text-red-600">{errors.returnAckMaintained.message}</p>
        ) : null}

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('returnAckLiability')} />I understand
          I may be responsible for identified issues or damage discovered once returned, as allowed
          by law.
        </label>
        {errors.returnAckLiability ? (
          <p className="text-xs text-red-600">{errors.returnAckLiability.message}</p>
        ) : null}
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Employee Signature (typed full name)
        </label>
        <input
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
          {...register('employeeReturnSignatureName')}
        />
        {errors.employeeReturnSignatureName ? (
          <p className="mt-1 text-xs text-red-600">{errors.employeeReturnSignatureName.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Recording...' : 'Record Return'}
        </button>
      </div>
    </form>
  );
}
