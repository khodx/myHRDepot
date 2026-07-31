import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';

interface MhdDateRangePresetsProps {
  onSelect: (dueFrom: string, dueTo: string) => void;
  className?: string;
}

type MhdDateRangePresetId =
  | 'this-week'
  | 'this-month'
  | 'last-quarter'
  | 'previous-quarter'
  | 'last-6-months'
  | 'this-year';

const PRESETS: Array<{ id: MhdDateRangePresetId; label: string }> = [
  { id: 'this-week', label: 'This week' },
  { id: 'this-month', label: 'This month' },
  { id: 'last-quarter', label: 'Last quarter' },
  { id: 'previous-quarter', label: 'Previous quarter' },
  { id: 'last-6-months', label: 'Last 6 months' },
  { id: 'this-year', label: 'This year' },
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfQuarter(year: number, quarterIndex: number): Date {
  return new Date(year, quarterIndex * 3, 1);
}

function endOfQuarter(year: number, quarterIndex: number): Date {
  return new Date(year, quarterIndex * 3 + 3, 0);
}

function computeDateRange(presetId: MhdDateRangePresetId, now: Date): [string, string] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarterIndex = Math.floor(month / 3);

  switch (presetId) {
    case 'this-week': {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(year, month, now.getDate() + mondayOffset);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return [toIsoDate(monday), toIsoDate(sunday)];
    }
    case 'this-month':
      return [toIsoDate(new Date(year, month, 1)), toIsoDate(new Date(year, month + 1, 0))];
    case 'last-quarter': {
      const lastQuarterIndex = quarterIndex - 1;
      const lastQuarterYear = lastQuarterIndex < 0 ? year - 1 : year;
      const normalizedQuarter = (lastQuarterIndex + 4) % 4;
      return [
        toIsoDate(startOfQuarter(lastQuarterYear, normalizedQuarter)),
        toIsoDate(endOfQuarter(lastQuarterYear, normalizedQuarter)),
      ];
    }
    case 'previous-quarter': {
      const previousQuarterIndex = quarterIndex - 2;
      const previousQuarterYear = previousQuarterIndex < 0 ? year - 1 : year;
      const normalizedQuarter = (previousQuarterIndex + 4) % 4;
      return [
        toIsoDate(startOfQuarter(previousQuarterYear, normalizedQuarter)),
        toIsoDate(endOfQuarter(previousQuarterYear, normalizedQuarter)),
      ];
    }
    case 'last-6-months': {
      const start = new Date(year, month - 5, 1);
      const end = new Date(year, month + 1, 0);
      return [toIsoDate(start), toIsoDate(end)];
    }
    case 'this-year':
      return [toIsoDate(new Date(year, 0, 1)), toIsoDate(new Date(year, 11, 31))];
  }
}

export function MhdDateRangePresets({ onSelect, className }: MhdDateRangePresetsProps) {
  return (
    <MhdFilterSelect
      label="Date Preset"
      value=""
      className={className}
      onChange={(event) => {
        const value = event.target.value as MhdDateRangePresetId | '';
        if (!value) return;
        const [dueFrom, dueTo] = computeDateRange(value, new Date());
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
