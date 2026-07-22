import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mhdPropertyDispositionSchema, type MhdPropertyDispositionSchemaInput } from '../Schemas';
import type { MhdPropertyDispositionStatus } from '../Types';

interface MhdPropertyDispositionFormProps {
  status: MhdPropertyDispositionStatus;
  isSubmitting: boolean;
  onSubmit: (input: MhdPropertyDispositionSchemaInput) => Promise<void>;
  onCancel: () => void;
}

export function MhdPropertyDispositionForm({
  status,
  isSubmitting,
  onSubmit,
  onCancel,
}: MhdPropertyDispositionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdPropertyDispositionSchemaInput>({
    resolver: zodResolver(mhdPropertyDispositionSchema),
    defaultValues: {
      status,
      notes: null,
    },
  });

  const isLost = status === 'LOST';

  return (
    <form className="space-y-4 rounded-lg border border-slate-200 bg-card p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{isLost ? 'Mark Property Lost' : 'Mark Property Damaged'}</h2>
          <p className="mt-1 text-sm text-slate-600">
            This closes the assignment without restoring available quantity.
          </p>
        </div>
        <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-700" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <input type="hidden" value={status} {...register('status')} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{isLost ? 'Loss Notes' : 'Damage Notes'}</label>
        <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={4} {...register('notes')} />
        {errors.notes ? <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p> : null}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-card px-4 py-2 text-sm font-semibold text-slate-700">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${isLost ? 'bg-amber-600' : 'bg-rose-700'}`}
        >
          {isSubmitting ? 'Saving...' : isLost ? 'Mark Lost' : 'Mark Damaged'}
        </button>
      </div>
    </form>
  );
}
