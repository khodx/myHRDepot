import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdDetailField } from '@/components/ui/MhdDetailField';
import {
  mhdUpdateHandbookSectionSchema,
  type MhdUpdateHandbookSectionFormValues,
} from '../Schemas';
import { mhdHandbookParentCandidates, type MhdHandbookSection } from '../Types';

interface Props {
  section: MhdHandbookSection;
  /** The library as currently loaded; the parent selector is built from it. */
  existingSections: MhdHandbookSection[];
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
export function MhdHandbookSectionEditForm({
  section,
  existingSections,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  // A section's place in the tree is edited here (applied through the move RPC), but
  // only to parents the server would accept: never itself or its own subsections.
  const parentChoices = mhdHandbookParentCandidates(existingSections, {
    handbookType: section.handbookType,
    jurisdiction: section.jurisdiction,
    scopeCompanyId: section.companyId,
    excludeSectionId: section.id,
  });
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
      parentSectionId: section.parentSectionId ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('sectionId')} readOnly />

      <MhdFormFieldStack className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <MhdDetailField label="Key" value={section.sectionKey} className="font-mono" />
        <MhdDetailField label="Type" value={section.handbookType} />
        <MhdDetailField label="Jurisdiction" value={section.jurisdiction} />
      </MhdFormFieldStack>

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
        <label htmlFor="edit-parentSectionId" className="block text-sm font-medium text-foreground">
          Parent section
        </label>
        <select
          id="edit-parentSectionId"
          {...register('parentSectionId')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">None (top-level section)</option>
          {parentChoices.map(({ section: candidate, depth }) => (
            <option key={candidate.id} value={candidate.id}>
              {`${'— '.repeat(depth)}${candidate.title}`}
            </option>
          ))}
        </select>
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

      <MhdFormFieldStack>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            {...register('isRequired')}
            className="h-4 w-4 rounded border-border"
          />
          Required
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 rounded border-border"
          />
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
      </MhdFormFieldStack>

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
