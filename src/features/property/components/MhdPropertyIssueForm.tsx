import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { mhdIssuePropertySchema, type MhdIssuePropertySchemaInput } from '../Schemas';
import type { MhdPropertyItem, MhdPropertyPersonOption } from '../Types';

interface MhdPropertyIssueFormProps {
  item: MhdPropertyItem;
  people: MhdPropertyPersonOption[];
  isSubmitting: boolean;
  onSubmit: (input: MhdIssuePropertySchemaInput) => Promise<void>;
  onCancel: () => void;
}

export function MhdPropertyIssueForm({
  item,
  people,
  isSubmitting,
  onSubmit,
  onCancel,
}: MhdPropertyIssueFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdIssuePropertySchemaInput>({
    resolver: zodResolver(mhdIssuePropertySchema),
    defaultValues: {
      propertyItemId: item.id,
      quantity: 1,
      issuerTitle: null,
      issuanceConditionNotes: null,
      employeeAckMaintain: false,
      employeeAckPolicy: false,
      employeeAckReceipt: false,
      employeeAckReportLoss: false,
      employeeSignatureName: '',
      personId: '',
    },
  });

  return (
    <form className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Issue Property</h2>
          <p className="mt-1 text-sm text-muted-foreground">Digitize the issuance form and capture all four acknowledgments plus the typed signature.</p>
        </div>
        <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-foreground" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="rounded-md border border-border bg-muted p-3 text-sm">
        <div className="font-medium text-foreground">{item.name}</div>
        <div className="mt-1 text-muted-foreground">Available: {item.quantityAvailable} of {item.quantityTotal}</div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Employee</label>
        <select className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('personId')}>
          <option value="">Select employee...</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.displayName}
            </option>
          ))}
        </select>
        {errors.personId ? <p className="mt-1 text-xs text-red-600">{errors.personId.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Quantity</label>
          <input
            type="number"
            min={1}
            max={item.quantityAvailable}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            {...register('quantity', {
              setValueAs: (value) => {
                if (value === '' || value === undefined || value === null) return undefined;
                return Number(value);
              },
            })}
          />
          {errors.quantity ? <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p> : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Issuer Title</label>
          <input className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('issuerTitle')} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Condition at Issuance</label>
        <textarea className="w-full rounded-md border border-border px-3 py-2 text-sm" rows={3} {...register('issuanceConditionNotes')} />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">Employee Acknowledgment</legend>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('employeeAckReceipt')} />
          I acknowledge receipt of the company-owned property listed above.
        </label>
        {errors.employeeAckReceipt ? <p className="text-xs text-red-600">{errors.employeeAckReceipt.message}</p> : null}

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('employeeAckMaintain')} />
          I agree to maintain the property in good condition and return it when I cease working, or earlier upon request.
        </label>
        {errors.employeeAckMaintain ? <p className="text-xs text-red-600">{errors.employeeAckMaintain.message}</p> : null}

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('employeeAckReportLoss')} />
          I agree to report any loss or damage immediately and use the property only for work-related purposes.
        </label>
        {errors.employeeAckReportLoss ? <p className="text-xs text-red-600">{errors.employeeAckReportLoss.message}</p> : null}

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" className="mt-1" {...register('employeeAckPolicy')} />
          I understand violation may be cause for discipline up to and including termination.
        </label>
        {errors.employeeAckPolicy ? <p className="text-xs text-red-600">{errors.employeeAckPolicy.message}</p> : null}
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Employee Signature (typed full name)</label>
        <input className="w-full rounded-md border border-border px-3 py-2 text-sm" {...register('employeeSignatureName')} />
        {errors.employeeSignatureName ? <p className="mt-1 text-xs text-red-600">{errors.employeeSignatureName.message}</p> : null}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
          Cancel
        </button>
        <Button type="submit" disabled={isSubmitting} className="font-semibold">
          {isSubmitting ? 'Issuing...' : 'Issue Property'}
        </Button>
      </div>
    </form>
  );
}
