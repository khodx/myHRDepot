import type { RegisterOptions } from 'react-hook-form';

/**
 * Register options for `<input type="number">` fields, replacing `valueAsNumber`.
 *
 * `valueAsNumber` turns a blank input into `NaN`. Zod rejects `NaN` with "expected number,
 * received NaN", so a blank field either produced that unreadable message (required fields)
 * or, worse, made an optional field impossible to leave empty (the Record Occurrence form's
 * Minutes input, and Activity duration). Blank is a real state; these options map it
 * deliberately:
 *
 * - `mhdOptionalNumberField` - blank means "no value" (`null`), matching schemas that declare
 *   the field `.optional().nullable()`.
 * - `mhdNumberField` - blank means "not provided" (`undefined`), so a schema default applies
 *   and a required field reports the schema's own message (give the number schema an
 *   `{ error: '...' }` so it reads as a sentence).
 *
 * Anything that is not a finite number is treated as blank rather than passed through as `NaN`.
 */
function toNumberOrBlank(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mhdOptionalNumberField(): Pick<RegisterOptions, 'setValueAs'> {
  return { setValueAs: (value: unknown) => toNumberOrBlank(value) };
}

export function mhdNumberField(): Pick<RegisterOptions, 'setValueAs'> {
  return { setValueAs: (value: unknown) => toNumberOrBlank(value) ?? undefined };
}
