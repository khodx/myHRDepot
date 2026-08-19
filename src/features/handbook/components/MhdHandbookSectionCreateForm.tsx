import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdCreateHandbookSectionSchema, type MhdCreateHandbookSectionFormValues } from '../Schemas';
import {
  MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
  MHD_HANDBOOK_JURISDICTIONS_BY_TYPE,
  MHD_HANDBOOK_TYPES,
  mhdFormatHandbookJurisdiction,
  mhdFormatHandbookType,
} from '../Types';

interface Props {
  companyId: string;
  /**
   * Whether the "Global library" scope choice is offered at all. Server-
   * enforced regardless (`mhd_create_handbook_section` refuses a non-PA/HRP
   * caller a null `p_company_id`) — this only governs whether the radio choice
   * is shown, matching the module's existing "affordance, not the boundary"
   * pattern (see `canManage` throughout this feature).
   */
  canCreateGlobal: boolean;
  onSubmit: (values: MhdCreateHandbookSectionFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Author a new library section — either GLOBAL (visible to every company, only
 * ever offered to Platform Admin / HR Partner) or company-owned. `bodyPlaceholder`
 * defaults to the standard attorney-flagged sentinel; this module never invents
 * real legal content, so the field starts on the placeholder rather than blank.
 */
export function MhdHandbookSectionCreateForm({
  companyId,
  canCreateGlobal,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MhdCreateHandbookSectionFormValues>({
    resolver: zodResolver(mhdCreateHandbookSectionSchema),
    defaultValues: {
      companyId,
      handbookType: 'EMPLOYEE',
      jurisdiction: MHD_HANDBOOK_JURISDICTIONS_BY_TYPE.EMPLOYEE[0],
      sectionKey: '',
      title: '',
      bodyPlaceholder: MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
      isRequired: false,
      sortOrder: 100,
    },
  });

  const handbookType = useWatch({ control, name: 'handbookType' });
  const jurisdictionChoices = MHD_HANDBOOK_JURISDICTIONS_BY_TYPE[handbookType] ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {canCreateGlobal ? (
        <div>
          <span className="block text-sm font-medium text-foreground">Scope</span>
          <Controller
            control={control}
            name="companyId"
            render={({ field }) => (
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    checked={field.value === companyId}
                    onChange={() => field.onChange(companyId)}
                    className="h-4 w-4 border-border"
                  />
                  This company only
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="radio"
                    checked={field.value === null}
                    onChange={() => field.onChange(null)}
                    className="h-4 w-4 border-border"
                  />
                  Global library
                </label>
              </div>
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            A global section is visible to every company and editable only by Platform Admin / HR
            Partner.
          </p>
        </div>
      ) : (
        <input type="hidden" value={companyId} {...register('companyId')} readOnly />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="handbookType" className="block text-sm font-medium text-foreground">
            Handbook type
          </label>
          <select
            id="handbookType"
            {...register('handbookType')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {MHD_HANDBOOK_TYPES.map((type) => (
              <option key={type} value={type}>
                {mhdFormatHandbookType(type)}
              </option>
            ))}
          </select>
          {errors.handbookType ? (
            <p className="mt-1 text-xs text-rose-600">{errors.handbookType.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="jurisdiction" className="block text-sm font-medium text-foreground">
            Jurisdiction
          </label>
          <select
            id="jurisdiction"
            {...register('jurisdiction')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {jurisdictionChoices.map((jurisdiction) => (
              <option key={jurisdiction} value={jurisdiction}>
                {mhdFormatHandbookJurisdiction(jurisdiction)}
              </option>
            ))}
          </select>
          {errors.jurisdiction ? (
            <p className="mt-1 text-xs text-rose-600">{errors.jurisdiction.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="sectionKey" className="block text-sm font-medium text-foreground">
          Section key
        </label>
        <input
          id="sectionKey"
          type="text"
          {...register('sectionKey')}
          placeholder="e.g. at-will"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.sectionKey ? (
          <p className="mt-1 text-xs text-rose-600">{errors.sectionKey.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          placeholder="e.g. At-Will Employment"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <label htmlFor="bodyPlaceholder" className="block text-sm font-medium text-foreground">
          Body placeholder
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Attorney-flagged placeholder text — this module never authors real legal content.
        </p>
        <textarea
          id="bodyPlaceholder"
          rows={3}
          {...register('bodyPlaceholder')}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.bodyPlaceholder ? (
          <p className="mt-1 text-xs text-rose-600">{errors.bodyPlaceholder.message}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" {...register('isRequired')} className="h-4 w-4 rounded border-border" />
          Required (auto-includes on assembly)
        </label>

        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-foreground">
            Sort order
          </label>
          <input
            id="sortOrder"
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
          {isSubmitting ? 'Creating…' : 'Create Section'}
        </Button>
      </div>
    </form>
  );
}
