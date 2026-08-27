import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { mhdLeaveTypeFormSchema, type MhdLeaveTypeFormValues } from '../Schemas';
import {
  MHD_LEAVE_JURISDICTIONS,
  MHD_LEAVE_MEASUREMENT_METHODS,
  mhdFormatLeaveJurisdiction,
  mhdFormatLeaveMeasurementMethod,
  type MhdLeaveType,
} from '../Types';

interface Props {
  companyId: string;
  /** Platform Admin / HR Partner only — lets the author publish a platform-global (library) type instead of a company one. */
  canPublishGlobal: boolean;
  /** When present, edits this type; otherwise creates a new one. */
  leaveType?: MhdLeaveType | null;
  onSubmit: (values: MhdLeaveTypeFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

/**
 * Create or edit a `leave_types` row — administrative config ONLY
 * (entitlement hours, measurement method, certification requirement,
 * citation). This form has no field for legal rule text: `leave_rule_sets`
 * (the real FMLA/CFRA/PDL content) stays behind the separate
 * counsel/compliance review gate documented in CLAUDE.md and is never
 * editable here.
 *
 * On edit, `typeKey`, `jurisdiction`, and global-vs-company scope are shown
 * read-only: `mhd_update_leave_type` doesn't accept any of them (see
 * `MhdUpdateLeaveTypeInput`), because changing any of the three would make
 * this a different type, not a revision of this one. The parent page reads
 * `isEdit` off `Boolean(leaveType)` and calls `createLeaveType` or
 * `updateLeaveType` accordingly — this component only collects values.
 */
export function MhdLeaveTypeForm({
  companyId,
  canPublishGlobal,
  leaveType,
  onSubmit,
  onCancel,
  isSubmitting,
}: Props) {
  const isEdit = Boolean(leaveType);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdLeaveTypeFormValues>({
    resolver: zodResolver(mhdLeaveTypeFormSchema),
    defaultValues: {
      typeId: leaveType?.id,
      isGlobal: leaveType?.isGlobal ?? false,
      companyId,
      typeKey: leaveType?.typeKey ?? '',
      typeName: leaveType?.typeName ?? '',
      jurisdiction: leaveType?.jurisdiction ?? 'FEDERAL',
      entitlementHours: leaveType?.entitlementHours ?? null,
      measurementMethod: leaveType?.measurementMethod ?? 'ROLLING_BACKWARD',
      measurementMonths: leaveType?.measurementMonths ?? null,
      requiresCertification: leaveType?.requiresCertification ?? false,
      citation: leaveType?.citation ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" value={companyId} {...register('companyId')} readOnly />
      {leaveType ? <input type="hidden" value={leaveType.id} {...register('typeId')} readOnly /> : null}

      <MhdFormFieldStack>
        <div>
          <label htmlFor="typeKey" className="block text-sm font-medium text-foreground">
            Type key
          </label>
          <input
            id="typeKey"
            type="text"
            {...register('typeKey')}
            readOnly={isEdit}
            placeholder="e.g. fmla, cfra, ca-sick"
            className={`mt-1 w-full rounded-md border border-border px-3 py-2 text-sm ${
              isEdit ? 'bg-muted text-muted-foreground' : ''
            }`}
          />
          {isEdit ? (
            <p className="mt-1 text-xs text-muted-foreground">
              The key is this type&apos;s stable identity and cannot be changed.
            </p>
          ) : null}
          {errors.typeKey ? <p className="mt-1 text-xs text-rose-600">{errors.typeKey.message}</p> : null}
        </div>

        <div>
          <label htmlFor="jurisdiction" className="block text-sm font-medium text-foreground">
            Jurisdiction
          </label>
          <select
            id="jurisdiction"
            {...register('jurisdiction')}
            disabled={isEdit}
            className={`mt-1 w-full rounded-md border border-border px-3 py-2 text-sm ${
              isEdit ? 'bg-muted text-muted-foreground' : ''
            }`}
          >
            {MHD_LEAVE_JURISDICTIONS.map((value) => (
              <option key={value} value={value}>
                {mhdFormatLeaveJurisdiction(value)}
              </option>
            ))}
          </select>
          {errors.jurisdiction ? (
            <p className="mt-1 text-xs text-rose-600">{errors.jurisdiction.message}</p>
          ) : null}
        </div>
      </MhdFormFieldStack>

      <div>
        <label htmlFor="typeName" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="typeName"
          type="text"
          {...register('typeName')}
          placeholder="e.g. Family and Medical Leave Act"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        {errors.typeName ? <p className="mt-1 text-xs text-rose-600">{errors.typeName.message}</p> : null}
      </div>

      {!isEdit && canPublishGlobal ? (
        <label className="flex items-start gap-2 text-sm text-foreground">
          <input type="checkbox" {...register('isGlobal')} className="mt-1 h-4 w-4 rounded border-border" />
          <span>
            Publish to the platform library (global)
            <span className="block text-xs font-normal text-muted-foreground">
              Readable and forkable by every company. Leave unchecked to create a type owned by your own
              company only.
            </span>
          </span>
        </label>
      ) : null}
      {isEdit && leaveType?.isGlobal ? (
        <p className="text-xs text-muted-foreground">
          This is a platform-global (library) type — editing it changes what every company resolves
          against.
        </p>
      ) : null}

      <MhdFormFieldStack>
        <div>
          <label htmlFor="entitlementHours" className="block text-sm font-medium text-foreground">
            Entitlement hours <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="entitlementHours"
            type="number"
            min={0}
            step="0.01"
            {...register('entitlementHours')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank for no fixed cap (e.g. a PER_EVENT or NONE measurement window).
          </p>
          {errors.entitlementHours ? (
            <p className="mt-1 text-xs text-rose-600">{errors.entitlementHours.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="measurementMethod" className="block text-sm font-medium text-foreground">
            Measurement method
          </label>
          <select
            id="measurementMethod"
            {...register('measurementMethod')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {MHD_LEAVE_MEASUREMENT_METHODS.map((value) => (
              <option key={value} value={value}>
                {mhdFormatLeaveMeasurementMethod(value)}
              </option>
            ))}
          </select>
          {errors.measurementMethod ? (
            <p className="mt-1 text-xs text-rose-600">{errors.measurementMethod.message}</p>
          ) : null}
        </div>
      </MhdFormFieldStack>

      <MhdFormFieldStack>
        <div>
          <label htmlFor="measurementMonths" className="block text-sm font-medium text-foreground">
            Measurement window (months){' '}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="measurementMonths"
            type="number"
            min={1}
            step={1}
            {...register('measurementMonths')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            E.g. 12 for FMLA/CFRA&apos;s rolling look-back. Leave blank when the method above has no window
            (PER_EVENT / NONE).
          </p>
          {errors.measurementMonths ? (
            <p className="mt-1 text-xs text-rose-600">{errors.measurementMonths.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="citation" className="block text-sm font-medium text-foreground">
            Citation <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="citation"
            type="text"
            {...register('citation')}
            placeholder="e.g. 29 CFR 825"
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          {errors.citation ? <p className="mt-1 text-xs text-rose-600">{errors.citation.message}</p> : null}
        </div>
      </MhdFormFieldStack>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          {...register('requiresCertification')}
          className="h-4 w-4 rounded border-border"
        />
        Requires medical certification
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save Type' : 'Create Type'}
        </Button>
      </div>
    </form>
  );
}
