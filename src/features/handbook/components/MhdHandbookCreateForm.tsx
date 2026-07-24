import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdCreateHandbookSchema, type MhdCreateHandbookFormValues } from '../Schemas';
import {
  MHD_HANDBOOK_JURISDICTIONS_BY_TYPE,
  MHD_HANDBOOK_TYPES,
  mhdFormatHandbookJurisdiction,
  mhdFormatHandbookType,
} from '../Types';

interface Props {
  companyId: string;
  onSubmit: (values: MhdCreateHandbookFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Step one of the wizard: pick the content pack + jurisdictions.
 *
 * The jurisdiction choices are the ones the chosen pack offers (EMPLOYEE draws
 * federal + states; SAFETY draws the OSHA scopes) — assembly is jurisdiction-
 * driven, and choosing a jurisdiction pulls its required sections in. The RPC
 * raises if no jurisdiction is chosen; the schema mirrors that as a field message.
 * Clause bodies are not authored here — they are attorney content.
 */
export function MhdHandbookCreateForm({ companyId, onSubmit, onCancel, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<MhdCreateHandbookFormValues>({
    resolver: zodResolver(mhdCreateHandbookSchema),
    defaultValues: {
      companyId,
      handbookType: 'EMPLOYEE',
      title: '',
      jurisdictions: [],
    },
  });

  const handbookType = watch('handbookType');
  const jurisdictionChoices = MHD_HANDBOOK_JURISDICTIONS_BY_TYPE[handbookType] ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />

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
        <label htmlFor="title" className="block text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          placeholder="e.g. 2026 Employee Handbook"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p> : null}
      </div>

      <div>
        <span className="block text-sm font-medium text-foreground">Jurisdictions</span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Assembly pulls in each jurisdiction's required sections.
        </p>
        {/* A controlled checkbox group over the pack's jurisdictions — the value is
            a string[] the create RPC consumes as `p_jurisdictions`. */}
        <Controller
          control={control}
          name="jurisdictions"
          render={({ field }) => (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {jurisdictionChoices.map((jurisdiction) => {
                const checked = field.value.includes(jurisdiction);
                return (
                  <label
                    key={jurisdiction}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        field.onChange(
                          event.target.checked
                            ? [...field.value, jurisdiction]
                            : field.value.filter((value) => value !== jurisdiction),
                        );
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    {mhdFormatHandbookJurisdiction(jurisdiction)}
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.jurisdictions ? (
          <p className="mt-1 text-xs text-rose-600">{errors.jurisdictions.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create draft'}
        </Button>
      </div>
    </form>
  );
}
