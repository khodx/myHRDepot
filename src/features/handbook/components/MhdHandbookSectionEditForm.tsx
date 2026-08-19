import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdUpdateHandbookSectionSchema, type MhdUpdateHandbookSectionFormValues } from '../Schemas';
import type { MhdHandbookSection } from '../Types';

interface Props {
  section: MhdHandbookSection;
  onSubmit: (values: MhdUpdateHandbookSectionFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Edit a section's editable fields. `handbookType`, `jurisdiction`, and
 * `sectionKey` are read-only here — `mhd_update_handbook_section` does not
 * accept them; changing which pack/jurisdiction/key a clause belongs to is a
 * new section, not an edit to this one. `isActive` lets a section be retired
 * without deleting it (assembly and the picker simply stop offering it).
 */
export function MhdHandbookSectionEditForm({ section, onSubmit, onCancel, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdUpdateHandbookSectionFormValues>({
    resolver: zodResolver(mhdUpdateHandbookSectionSchema),
    defaultValues: {
      sectionId: section.id,
      title: section.title,
      bodyPlaceholder: section.bodyPlaceholder,
      isRequired: section.isRequired,
      sortOrder: section.sortOrder,
      isActive: section.isActive,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('sectionId')} readOnly />

      <dl className="grid gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="font-medium text-foreground">Key</dt>
          <dd className="font-mono">{section.sectionKey}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Type</dt>
          <dd>{section.handbookType}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Jurisdiction</dt>
          <dd>{section.jurisdiction}</dd>
        </div>
      </dl>

      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="edit-title"
          type="text"
          {...register('title')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="edit-bodyPlaceholder" className="block text-sm font-medium text-foreground">
          Body placeholder
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Attorney-flagged placeholder text — this module never authors real legal content.
        </p>
        <textarea
          id="edit-bodyPlaceholder"
          rows={3}
          {...register('bodyPlaceholder')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.bodyPlaceholder ? (
          <p className="mt-1 text-xs text-rose-600">{errors.bodyPlaceholder.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register('isRequired')} className="h-4 w-4 rounded border-border" />
          Required
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-border" />
          Active
        </label>

        <div>
          <label htmlFor="edit-sortOrder" className="block text-sm font-medium text-foreground">
            Sort order
          </label>
          <input
            id="edit-sortOrder"
            type="number"
            {...register('sortOrder')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          {errors.sortOrder ? (
            <p className="mt-1 text-xs text-rose-600">{errors.sortOrder.message}</p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Section'}
        </Button>
      </div>
    </form>
  );
}
