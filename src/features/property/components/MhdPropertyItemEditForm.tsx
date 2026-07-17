import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mhdUpdatePropertyItemSchema, type MhdUpdatePropertyItemSchemaInput } from '../Schemas';
import { MHD_PROPERTY_ITEM_STATUSES, type MhdPropertyItem } from '../Types';

interface MhdPropertyItemEditFormProps {
  item: MhdPropertyItem;
  isSubmitting: boolean;
  onSubmit: (input: MhdUpdatePropertyItemSchemaInput) => Promise<void>;
  onCancel: () => void;
}

export function MhdPropertyItemEditForm({
  item,
  isSubmitting,
  onSubmit,
  onCancel,
}: MhdPropertyItemEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdUpdatePropertyItemSchemaInput>({
    resolver: zodResolver(mhdUpdatePropertyItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description,
      status: item.status,
      conditionNotes: item.conditionNotes,
    },
  });

  return (
    <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Edit Property Item</h2>
          <p className="mt-1 text-sm text-slate-600">The live update RPC supports name, description, status, and condition notes.</p>
        </div>
        <button type="button" className="text-sm font-semibold text-slate-500 hover:text-slate-700" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Item Name</label>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('name')} />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
          <select className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('status')}>
            {MHD_PROPERTY_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Condition Notes</label>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('conditionNotes')} />
          {errors.conditionNotes ? <p className="mt-1 text-xs text-red-600">{errors.conditionNotes.message}</p> : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" rows={3} {...register('description')} />
        {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Save Item Changes'}
        </button>
      </div>
    </form>
  );
}
