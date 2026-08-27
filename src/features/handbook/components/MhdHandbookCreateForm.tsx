import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { useMhdHandbookSafetyJurisdictions } from '../Hook';
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
  /** Pre-selects the content pack — used by the Workplace Safety module's cross-link. */
  defaultHandbookType?: MhdCreateHandbookFormValues['handbookType'];
  /**
   * When the caller arrived from a specific establishment (the Workplace
   * Safety module's cross-link), the SAFETY jurisdiction lookup is scoped to
   * that establishment rather than the whole company.
   */
  establishmentId?: string | null;
}

/**
 * Step one of the wizard: pick the content pack + jurisdictions.
 *
 * The jurisdiction choices EMPLOYEE offers remain the static federal + states
 * list (unchanged by this stage). SAFETY's choices now come from the
 * Workplace Safety module's real, computed jurisdiction set
 * (`mhd_compute_osha_thresholds`, via `useMhdHandbookSafetyJurisdictions`)
 * instead of always offering both FED_OSHA and CAL_OSHA regardless of the
 * company's actual establishments — a static "always both" list is exactly
 * the kind of hardcoded-value-pretending-to-be-real-data the CLAUDE.md
 * engineering standard prohibits once real data exists. When the company has
 * no `osha_establishments` rows yet (or none currently meet a threshold),
 * the RPC returns an empty set and this form falls back to the static list
 * with a visible note — Workplace Safety (03.31) is optional-adoption, not a
 * hard prerequisite for handbook creation, so this never blocks the flow.
 *
 * Assembly is jurisdiction-driven either way: choosing a jurisdiction pulls
 * its required sections in. The RPC raises if no jurisdiction is chosen; the
 * schema mirrors that as a field message. Clause bodies are not authored
 * here — they are attorney content.
 */
export function MhdHandbookCreateForm({
  companyId,
  onSubmit,
  onCancel,
  isSubmitting,
  defaultHandbookType,
  establishmentId,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MhdCreateHandbookFormValues>({
    resolver: zodResolver(mhdCreateHandbookSchema),
    defaultValues: {
      companyId,
      handbookType: defaultHandbookType ?? 'EMPLOYEE',
      title: '',
      jurisdictions: [],
    },
  });

  const handbookType = useWatch({ control, name: 'handbookType' });
  const safetyJurisdictions = useMhdHandbookSafetyJurisdictions(
    handbookType === 'SAFETY' ? companyId : null,
    establishmentId,
  );
  const staticJurisdictionChoices = MHD_HANDBOOK_JURISDICTIONS_BY_TYPE[handbookType] ?? [];
  const usingComputedSafetyJurisdictions =
    handbookType === 'SAFETY' && (safetyJurisdictions.data?.length ?? 0) > 0;
  const jurisdictionChoices = usingComputedSafetyJurisdictions
    ? (safetyJurisdictions.data as MhdCreateHandbookFormValues['jurisdictions'])
    : staticJurisdictionChoices;

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
        {handbookType === 'SAFETY' && !usingComputedSafetyJurisdictions ? (
          <p className="mt-1 text-xs text-amber-700">
            Using general Fed-OSHA/Cal-OSHA defaults — configure establishments in the Workplace
            Safety module for jurisdiction-specific accuracy.
          </p>
        ) : null}
        {/* A controlled checkbox group over the pack's jurisdictions — the value is
            a string[] the create RPC consumes as `p_jurisdictions`. */}
        <Controller
          control={control}
          name="jurisdictions"
          render={({ field }) => (
            <MhdFormFieldStack className="mt-2">
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
            </MhdFormFieldStack>
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
