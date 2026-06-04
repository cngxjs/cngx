/**
 * Shallow structural equality for two readonly Sets. Returns `true` when
 * both sets reference the same object, or when they have the same size and
 * every element of `a` is present in `b`. Element comparison uses `Set.has`
 * (SameValueZero semantics).
 *
 * Intended as an `equal` arg for `computed()` / `linkedSignal` returning
 * `ReadonlySet<T>`, so consumers downstream do not re-render when the
 * computed re-runs but produces the same element set.
 *
 * @category utils
 */
export function setEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }
  return true;
}

/**
 * Shallow positional equality for two readonly arrays. Returns `true` when
 * both arrays reference the same object, or when they have the same length
 * and every index holds a `Object.is`-equal value.
 *
 * Intended as an `equal` arg for `computed()` / `linkedSignal` returning
 * `readonly T[]`, so consumers downstream do not re-render when the
 * computed re-runs but produces a positionally-identical array. Two arrays
 * with the same values in a different order compare unequal.
 *
 * @category utils
 */
export function arrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) {
      return false;
    }
  }
  return true;
}
