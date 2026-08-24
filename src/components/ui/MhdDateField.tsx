import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MhdDateFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  min?: string;
  max?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function isoToDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return '';
  const [, yyyy, mm, dd] = match;
  return `${mm}/${dd}/${yyyy}`;
}

function displayToIso(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

/** Reformats free-typed digits into the ##/##/#### mask as the user types. */
function formatTypedDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const segments: string[] = [];
  segments.push(digits.slice(0, 2));
  if (digits.length > 2) segments.push(digits.slice(2, 4));
  if (digits.length > 4) segments.push(digits.slice(4, 8));
  return segments.join('/');
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarWeeks(viewMonth: Date): Array<Array<Date | null>> {
  const first = startOfMonth(viewMonth);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: Array<Array<Date | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * Shared date input: type ##/##/#### directly, or click anywhere in the
 * field to open a calendar popup. Value/onChange use the same ISO
 * 'YYYY-MM-DD' string contract as `<input type="date">` so it's a drop-in
 * replacement everywhere. Not for timestamp fields — those stay read-only.
 */
export function MhdDateField({
  id,
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  className,
  disabled,
  required,
  name,
  min,
  max,
  ...ariaProps
}: MhdDateFieldProps) {
  const [text, setText] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const iso = displayToIso(isoToDisplay(value));
    return iso ? new Date(`${iso}T00:00:00`) : startOfMonth(new Date());
  });
  const [syncedValue, setSyncedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Adjusts local editing state when `value` changes externally, without the
  // extra render an effect-based sync would cost — the React-recommended
  // alternative to deriving state from props in an effect.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(isoToDisplay(value));
    const iso = displayToIso(isoToDisplay(value));
    if (iso) setViewMonth(new Date(`${iso}T00:00:00`));
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        const iso = displayToIso(text);
        setText(iso ? isoToDisplay(iso) : isoToDisplay(value));
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, text, value]);

  const weeks = useMemo(() => buildCalendarWeeks(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  function commitText(nextText: string) {
    setText(nextText);
    const iso = displayToIso(nextText);
    if (iso) {
      onChange(iso);
      setViewMonth(new Date(`${iso}T00:00:00`));
    } else if (nextText === '') {
      onChange('');
    }
  }

  function selectDay(day: Date) {
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
      day.getDate(),
    ).padStart(2, '0')}`;
    setText(isoToDisplay(iso));
    onChange(iso);
    setOpen(false);
    inputRef.current?.focus();
  }

  const selectedIso = displayToIso(text);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-accent',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={text}
          min={min}
          max={max}
          onFocus={() => setOpen(true)}
          onChange={(event) => commitText(formatTypedDigits(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
          className="w-full min-w-0 border-none bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          {...ariaProps}
        />
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() =>
                setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground">{monthLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() =>
                setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-y-1 text-center text-sm">
              {week.map((day, dayIndex) => {
                if (!day) return <span key={dayIndex} />;
                const dayIso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(
                  day.getDate(),
                ).padStart(2, '0')}`;
                const isSelected = dayIso === selectedIso;
                return (
                  <button
                    key={dayIndex}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-foreground hover:bg-muted',
                      isSelected && 'bg-accent text-accent-foreground hover:bg-accent-hover',
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
