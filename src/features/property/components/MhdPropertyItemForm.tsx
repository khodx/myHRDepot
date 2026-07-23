import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { mhdCreatePropertyItemSchema, type MhdCreatePropertyItemSchemaInput } from '../Schemas';
import { MHD_PROPERTY_CATEGORIES } from '../Types';

interface MhdPropertyItemFormProps {
  companyId: string;
  isSubmitting: boolean;
  onSubmit: (input: MhdCreatePropertyItemSchemaInput) => Promise<void>;
  onCancel: () => void;
}

export function MhdPropertyItemForm({
  companyId,
  isSubmitting,
  onSubmit,
  onCancel,
}: MhdPropertyItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdCreatePropertyItemSchemaInput>({
    resolver: zodResolver(mhdCreatePropertyItemSchema),
    defaultValues: {
      companyId,
      category: 'OTHER',
      quantityTotal: 1,
      description: null,
      serialNumber: null,
      unitCost: null,
      acquisitionDate: null,
    },
  });

  return (
    <form className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Add Property Item</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create the inventory record before issuing it to an employee.</p>
        </div>
        <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-foreground" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Item Name</label>
        <input className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('name')} />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Category</label>
          <select className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('category')}>
            {MHD_PROPERTY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Serial Number</label>
          <input className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('serialNumber')} />
          {errors.serialNumber ? <p className="mt-1 text-xs text-red-600">{errors.serialNumber.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Quantity Total</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('quantityTotal', {
              setValueAs: (value) => {
                if (value === '' || value === undefined || value === null) return undefined;
                return Number(value);
              },
            })}
          />
          {errors.quantityTotal ? <p className="mt-1 text-xs text-red-600">{errors.quantityTotal.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Unit Cost</label>
          <input
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('unitCost', {
              setValueAs: (value) => {
                if (value === '' || value === undefined || value === null) return undefined;
                return Number(value);
              },
            })}
          />
          {errors.unitCost ? <p className="mt-1 text-xs text-red-600">{errors.unitCost.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Acquisition Date</label>
          <input type="date" className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('acquisitionDate')} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Description</label>
        <textarea className="w-full rounded-md border border-border px-3 py-2 text-sm" rows={3} {...register('description')} />
        {errors.description ? <p className="mt-1 text-xs text-red-600">{errors.description.message}</p> : null}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
          Cancel
        </button>
        <Button type="submit" disabled={isSubmitting} className="font-semibold">
          {isSubmitting ? 'Saving...' : 'Add Property Item'}
        </Button>
      </div>
    </form>
  );
}
