import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/utils/cn';

export type MhdViewMode = 'list' | 'board';

interface MhdViewToggleProps {
  value: MhdViewMode;
  onChange: (mode: MhdViewMode) => void;
  className?: string;
}

/**
 * Small List / Board segmented control for pipeline-style modules (Recruiting,
 * Tasks, Leaves, Accommodations). Persistence is the caller's responsibility —
 * each page reads/writes its own `localStorage` key, matching the pattern in
 * `MhdSidebar.tsx` (`MHD_NAV_COLLAPSE_KEY`/`MHD_RAIL_STATE_KEY`): read once on
 * mount inside a `useState` initializer, guarded by a try/catch for
 * private-mode/non-browser environments, and write on change.
 */
export function MhdViewToggle({ value, onChange, className }: MhdViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Switch between list and board view"
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-card p-0.5 shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-semibold transition-colors',
          value === 'list'
            ? 'bg-accent text-accent-on'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="h-3.5 w-3.5" aria-hidden />
        List
      </button>
      <button
        type="button"
        aria-pressed={value === 'board'}
        onClick={() => onChange('board')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-semibold transition-colors',
          value === 'board'
            ? 'bg-accent text-accent-on'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
        Board
      </button>
    </div>
  );
}

/** Read a persisted view mode from `localStorage`, defaulting to `board` per module convention. */
export function mhdReadPersistedViewMode(key: string): MhdViewMode {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === 'list' || raw === 'board' ? raw : 'board';
  } catch {
    // localStorage unavailable (private mode / non-browser env) — default to board.
    return 'board';
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
