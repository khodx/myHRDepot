import { LayoutGrid, List } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export type MhdViewMode = 'list' | 'board';

interface MhdViewToggleProps {
  value: MhdViewMode;
  onChange: (mode: MhdViewMode) => void;
  className?: string;
}

/**
 * List / Board switcher for pipeline-style modules (Tasks, Leaves,
 * Accommodations). Styled as separate primary/secondary pill buttons —
 * matching the record-detail tab convention (e.g. MhdTaskRecordTabs: active
 * tab is the primary pill, inactive tabs are secondary pills) rather than a
 * single bordered segmented control, so view switching reads consistently
 * with the rest of the platform's "these are buttons" tab pattern.
 * Persistence is the caller's responsibility — each page reads/writes its own
 * `localStorage` key, matching the pattern in `MhdSidebar.tsx`
 * (`MHD_NAV_COLLAPSE_KEY`/`MHD_RAIL_STATE_KEY`): read once on mount inside a
 * `useState` initializer, guarded by a try/catch for private-mode/non-browser
 * environments, and write on change.
 */
export function MhdViewToggle({ value, onChange, className }: MhdViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Switch between list and board view"
      className={cn('flex items-center gap-2', className)}
    >
      <button
        type="button"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        className={cn(
          buttonBaseClasses,
          'h-9 gap-1.5 px-3 text-[16.8px]',
          value === 'list' ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
        )}
      >
        <List className="h-4 w-4" aria-hidden />
        List
      </button>
      <button
        type="button"
        aria-pressed={value === 'board'}
        onClick={() => onChange('board')}
        className={cn(
          buttonBaseClasses,
          'h-9 gap-1.5 px-3 text-[16.8px]',
          value === 'board' ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Board
      </button>
    </div>
  );
}

/** Read a persisted view mode from `localStorage`, defaulting to `list` per module convention. */
export function mhdReadPersistedViewMode(key: string): MhdViewMode {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === 'list' || raw === 'board' ? raw : 'list';
  } catch {
    // localStorage unavailable (private mode / non-browser env) — default to list.
    return 'list';
  }
}

/** Persist a view mode choice to `localStorage`, tolerating unavailable storage. */
export function mhdWritePersistedViewMode(key: string, mode: MhdViewMode) {
  try {
    window.localStorage.setItem(key, mode);
  } catch {
    // localStorage unavailable — view mode stays in-memory only for this session.
  }
}
