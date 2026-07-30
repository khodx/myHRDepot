import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MhdMultiSelectComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface MhdMultiSelectComboboxProps {
  options: MhdMultiSelectComboboxOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Generic searchable multi-select: a text input filters `options`
 * client-side, matches toggle in/out of `value` via checkboxes, and
 * selections render as removable chips above the input. Not tied to any one
 * module — first consumer is Task's Assigned Users field.
 */
export function MhdMultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder = 'Search…',
  emptyMessage = 'No matches.',
  className,
}: MhdMultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.id)),
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

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {selectedOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-hover"
            >
              {option.label}
              <button
                type="button"
                onClick={() => remove(option.id)}
                aria-label={`Remove ${option.label}`}
                className="rounded-full hover:bg-accent/20"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span>
          {selectedOptions.length > 0
            ? `${selectedOptions.length} selected`
            : (placeholder ?? 'Select…')}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
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
              placeholder={placeholder}
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto p-1" role="listbox" aria-multiselectable>
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggle(option.id)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="h-3.5 w-3.5 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-foreground">{option.label}</span>
                        {option.sublabel ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {option.sublabel}
                          </span>
                        ) : null}
                      </span>
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
