import { cn } from '@/utils/cn';

export interface MhdTabItem<T extends string = string> {
  value: T;
  label: string;
  /** Optional count chip, e.g. Subtasks (6). */
  count?: number;
}

interface MhdTabsProps<T extends string> {
  tabs: ReadonlyArray<MhdTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Underline tab bar. Neutral text; the active tab takes the category primary
 * as its text color and a 3px underline (category spec §4 component contract).
 */
export function MhdTabs<T extends string>({ tabs, value, onChange, className }: MhdTabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex gap-1 border-b border-border', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px inline-flex items-center gap-1.5 border-b-[3px] px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
              isActive
                ? 'border-accent text-accent-hover'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  isActive ? 'bg-accent-tint text-accent-hover' : 'bg-muted text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
