import {
  computeMhdDateRangePreset,
  MHD_DATE_RANGE_PRESETS,
  type MhdDateRangePresetId,
} from '@/components/ui/MhdDateRangePresets';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { cn } from '@/utils/cn';

interface MhdDateRangeFieldProps {
  label: string;
  from: string;
  to: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  onPresetSelect: (from: string, to: string) => void;
  className?: string;
}

const dateInputClass = 'w-full min-w-0';

/**
 * Replaces what used to be two separate "X From" / "X To" filter boxes with one field:
 * a From/To pair on one row plus a preset dropdown that fills both at once.
 */
export function MhdDateRangeField({
  label,
  from,
  to,
  onChangeFrom,
  onChangeTo,
  onPresetSelect,
  className,
}: MhdDateRangeFieldProps) {
  const fieldId = `mhd-date-range-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <select
          aria-label={`${label} preset`}
          value=""
          className="rounded border-none bg-transparent text-[11px] font-medium text-accent hover:text-accent-hover focus-visible:outline-none"
          onChange={(event) => {
            const value = event.target.value as MhdDateRangePresetId | '';
            if (!value) return;
            const [presetFrom, presetTo] = computeMhdDateRangePreset(value, new Date());
            onPresetSelect(presetFrom, presetTo);
            event.currentTarget.value = '';
          }}
        >
          <option value="">Preset...</option>
          {MHD_DATE_RANGE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <MhdDateField
          id={fieldId}
          aria-label={`${label} from`}
          value={from}
          onChange={onChangeFrom}
          className={dateInputClass}
        />
        <span className="text-xs text-muted-foreground" aria-hidden>
          –
        </span>
        <MhdDateField
          aria-label={`${label} to`}
          value={to}
          onChange={onChangeTo}
          className={dateInputClass}
        />
      </div>
    </div>
  );
}
