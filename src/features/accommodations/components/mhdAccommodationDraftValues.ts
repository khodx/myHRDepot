/**
 * Draft payloads come back from the server as unknown JSON. These read a field back only when it
 * has the expected shape, so a stale or hand-edited draft can never put a wrong type into a form.
 */
export function draftText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function draftFlag(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function draftChoice<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
