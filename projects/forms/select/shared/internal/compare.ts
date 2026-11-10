/**
 * Element-wise array equality under a caller comparator. Short-circuits on
 * reference equality and length mismatch.
 *
 * @internal
 */
export function sameArrayContents<T>(
  a: readonly T[],
  b: readonly T[],
  eq: (x: T, y: T) => boolean,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Whether a scalar select value counts as no selection. `null` arrives from
 * nullable Reactive Forms controls and Signal Forms fields, `''` from a Signal
 * Forms string field at its start value; both read like `undefined`.
 *
 * @internal
 */
export function isEmptyScalar(v: unknown): v is undefined | null | '' {
  return v === undefined || v === null || v === '';
}

/**
 * Coerces a scalar value arriving from a form field into the component's value
 * shape: an empty scalar (`undefined`, `null`, `''`) reads as `undefined`, any
 * other value passes through. Shared by every scalar composite's `createFieldSync`
 * so they agree on what an empty field means.
 *
 * @internal
 */
export function coerceScalarFromField<T>(x: unknown): T | undefined {
  return isEmptyScalar(x) ? undefined : (x as T);
}
