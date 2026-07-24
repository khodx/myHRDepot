import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
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
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Edit Property Item</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The live update RPC supports name, description, status, and condition notes.
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

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Item Name</label>
        <input
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
          {...register('name')}
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Status</label>
          <select
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('status')}
          >
            {MHD_PROPERTY_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Condition Notes</label>
          <input
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('conditionNotes')}
          />
          {errors.conditionNotes ? (
            <p className="mt-1 text-xs text-red-600">{errors.conditionNotes.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <textarea
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
          rows={3}
          {...register('description')}
        />
        {errors.description ? (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
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
        <Button type="submit" disabled={isSubmitting} className="font-semibold">
          {isSubmitting ? 'Saving...' : 'Save Item Changes'}
        </Button>
      </div>
    </form>
  );
}
