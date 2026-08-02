export type MhdViewMode = 'list' | 'board';

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
