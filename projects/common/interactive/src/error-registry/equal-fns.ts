import type { CngxErrorAggregatorSourceEntry } from '../error-aggregator/error-aggregator.token';

/**
 * Length-then-key-set equality for `ReadonlyMap` signals.
 *
 * Returns `true` when both maps have the same size AND same key set,
 * **regardless of value identity**. Used by the error registry to
 * short-circuit emissions when an aggregator is replaced under the same
 * name (the downstream computeds re-evaluate per registered aggregator's
 * own signals, not per Map identity).
 *
 * @internal
 */
export function mapKeySetEqual<K, V>(
  a: ReadonlyMap<K, V>,
  b: ReadonlyMap<K, V>,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const key of a.keys()) {
    if (!b.has(key)) {
      return false;
    }
  }
  return true;
}

/**
 * Element-wise equality for readonly arrays. Reference-equal on `===`,
 * length+per-index `===` otherwise.
 *
 * @internal
 */
export function shallowReadonlyArrayEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Equality for the source-entry map carried by `CngxErrorAggregator`. Same
 * size, same keys, same `condition` Signal identity per entry, same label.
 * Shared by the directive and the {@link injectErrorAggregator} factory so
 * cascade-suppression behaviour stays in one place.
 *
 * @internal
 */
export function errorSourceMapEqual(
  a: ReadonlyMap<string, CngxErrorAggregatorSourceEntry>,
  b: ReadonlyMap<string, CngxErrorAggregatorSourceEntry>,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, entryA] of a) {
    const entryB = b.get(key);
    if (
      entryB?.condition !== entryA.condition ||
      (entryB.label ?? null) !== (entryA.label ?? null)
    ) {
      return false;
    }
  }
  return true;
}
