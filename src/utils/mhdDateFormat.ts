// Shared date-formatting helpers. Before 2026-08-06 (audit finding L1/L2),
// the bare `new Date(x).toLocaleString()` idiom was independently repeated
// across ~9 call sites in `activities`/`attachments`/`admin`, and
// `new Date().toISOString().slice(0, 10)` (today, or a given date, as
// `YYYY-MM-DD`) was independently repeated across ~9 call sites in
// `tasks`/`timeattendance`. This does not replace call sites that pass their
// own `Intl.DateTimeFormat`/`toLocaleDateString` options — those are
// intentionally distinct formats, not duplicates of these bare defaults.

/** `new Date(value).toLocaleString()` with a fallback for null/undefined. */
export function mhdFormatDateTime(value: string | Date | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  return new Date(value).toLocaleString();
}

/** `new Date(value).toLocaleDateString()` with a fallback for null/undefined. */
export function mhdFormatDate(value: string | Date | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString();
}

/** `YYYY-MM-DD` for a given date (defaults to now). */
export function mhdToIsoDateString(date: string | Date = new Date()): string {
  return new Date(date).toISOString().slice(0, 10);
}
