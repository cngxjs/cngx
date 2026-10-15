/** A plain JSON object, as `JSON.parse` returns it. */
export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The message of a thrown value; a non-Error is stringified. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** `a`, `a and b`, `a, b and c`: names in a reason line. */
export function joinNames(names: readonly string[]): string {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
