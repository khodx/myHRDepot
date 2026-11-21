import { MhdDateField } from '@/components/ui/MhdDateField';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export interface MhdAccommodationEquipmentValue {
  orderedOn: string;
  /** A users.id (accommodation_implementations.equipment_ordered_by references users). */
  orderedBy: string;
  receivedOn: string;
}

export interface MhdAccommodationEquipmentUserOption {
  id: string;
  displayName: string;
}

export type MhdAccommodationEquipmentErrors = Partial<
  Record<keyof MhdAccommodationEquipmentValue, string>
>;

interface MhdAccommodationEquipmentFieldsProps {
  value: MhdAccommodationEquipmentValue;
  onChange: (next: MhdAccommodationEquipmentValue) => void;
  disabled?: boolean;
  /** The company's platform users who can be recorded as having placed the order. */
  userOptions: MhdAccommodationEquipmentUserOption[];
  /** Field messages from mhdAccommodationEquipmentSchema, when the caller validates. */
  errors?: MhdAccommodationEquipmentErrors;
  /** Prefix that keeps the input ids unique when several cards render on one page. */
  idPrefix: string;
}

/** Equipment ordered and received (Section D). Shared by the implementation form and the update card. */
export function MhdAccommodationEquipmentFields({
  value,
  onChange,
  disabled = false,
  userOptions,
  errors,
  idPrefix,
}: MhdAccommodationEquipmentFieldsProps) {
  const orderedOnId = `${idPrefix}-equipment-ordered-on`;
  const orderedById = `${idPrefix}-equipment-ordered-by`;
  const receivedOnId = `${idPrefix}-equipment-received-on`;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <label className="block text-sm font-medium" htmlFor={orderedOnId}>
          Equipment Ordered On
        </label>
        <MhdDateField
          id={orderedOnId}
          className={`mt-1 ${inputClass}`}
          value={value.orderedOn}
          disabled={disabled}
          aria-invalid={Boolean(errors?.orderedOn)}
          onChange={(orderedOn) => onChange({ ...value, orderedOn })}
        />
        {errors?.orderedOn ? (
          <p className="mt-1 text-xs text-rose-700">{errors.orderedOn}</p>
        ) : null}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor={orderedById}>
          Ordered By
        </label>
        <select
          id={orderedById}
          className={`mt-1 ${inputClass}`}
          value={value.orderedBy}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, orderedBy: event.target.value })}
        >
          <option value="">Not Recorded</option>
          {userOptions.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName}
            </option>
          ))}
        </select>
        {errors?.orderedBy ? (
          <p className="mt-1 text-xs text-rose-700">{errors.orderedBy}</p>
        ) : null}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor={receivedOnId}>
          Equipment Received On
        </label>
        <MhdDateField
          id={receivedOnId}
          className={`mt-1 ${inputClass}`}
          value={value.receivedOn}
          disabled={disabled}
          aria-invalid={Boolean(errors?.receivedOn)}
          onChange={(receivedOn) => onChange({ ...value, receivedOn })}
        />
        {errors?.receivedOn ? (
          <p className="mt-1 text-xs text-rose-700">{errors.receivedOn}</p>
        ) : null}
      </div>
    </div>
  );
}

export default MhdAccommodationEquipmentFields;
