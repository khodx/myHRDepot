import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MHD_DATE_RANGE_PRESETS, computeMhdDateRangePreset, type MhdDateRangePresetId } from './MhdDateRangePresetsUtils';

interface MhdDateRangePresetsProps {
  onSelect: (dueFrom: string, dueTo: string) => void;
  className?: string;
}
const PRESETS = MHD_DATE_RANGE_PRESETS;

export function MhdDateRangePresets({ onSelect, className }: MhdDateRangePresetsProps) {
  return (
    <MhdFilterSelect
      label="Date Preset"
      value=""
      className={className}
      onChange={(event) => {
        const value = event.target.value as MhdDateRangePresetId | '';
        if (!value) return;
        const [dueFrom, dueTo] = computeMhdDateRangePreset(value, new Date());
        onSelect(dueFrom, dueTo);
        event.currentTarget.value = '';
      }}
    >
      <option value="">Select range</option>
      {PRESETS.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.label}
        </option>
      ))}
    </MhdFilterSelect>
  );
}
