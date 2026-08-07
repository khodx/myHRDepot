import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useMhdClickOutside } from '@/utils/useMhdClickOutside';

export interface MhdSearchableSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface MhdSearchableSelectProps {
  options: MhdSearchableSelectOption[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Generic searchable single-select: a text input filters `options`
 * client-side and picking one closes the panel. When `disabled`, renders as
 * a static muted box showing the current selection's label instead of an
 * inert control — the same read-only-display convention used for locked
 * record fields (e.g. a task's Company field) rather than a greyed-out
 * dropdown.
 */
export function MhdSearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  emptyMessage = 'No matches.',
  disabled = false,
  className,
  id,
}: MhdSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  useMhdClickOutside(containerRef, () => setOpen(false));

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === '') return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(normalized) ||
        option.sublabel?.toLowerCase().includes(normalized),
    );
  }, [options, query]);

  function select(nextId: string) {
    onChange(nextId);
    setOpen(false);
    setQuery('');
  }

  if (disabled) {
    return (
      <div
        id={id}
        className={cn(
          'rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground',
          className,
        )}
      >
        {selectedOption?.label ?? placeholder}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto p-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.id === value;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => select(option.id)}
                      className={cn(
                        'block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted',
                        isSelected ? 'bg-accent/10 text-accent-hover' : 'text-foreground',
                      )}
                    >
                      <span className="block truncate">{option.label}</span>
                      {option.sublabel ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.sublabel}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
