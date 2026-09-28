import { computed, type Signal } from '@angular/core';

import { recordEqual } from '@cngx/utils';

import { coerceSignal } from './coerce.util';

const NO_OVERRIDES: object = {};

const MERGES = new WeakMap<object, WeakMap<object, Signal<object>>>();

/**
 * Merges a partial override bundle over a defaults bundle into one signal.
 * Either side may be a plain value or a `Signal`, so a label bundle declared
 * static today keeps working when the consumer later hands in a live
 * `Signal` for runtime language switching - the merge re-derives on either
 * side's change.
 *
 * The merge `computed()` uses `recordEqual`, so re-setting the override to a
 * new but key-wise equal object keeps the merged reference and downstream
 * readers do not re-run. Results are memoized per (defaults, overrides)
 * reference pair: every instance under one injector that reads the same
 * config object gets the same signal, so row-level components allocate
 * nothing after the first. `undefined` overrides share one entry per
 * defaults reference.
 *
 * The merge is a plain spread, like every `with*I18nLabels` feature: a key
 * present in the override wins even when its value is `undefined`, so build
 * override objects from the keys you mean to set, never from `{ key: maybe }`.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo coerceSignal, createControlledSource
 */
export function createOverrideMerge<T extends object>(
  defaults: T | Signal<T>,
  overrides: Partial<T> | Signal<Partial<T>> | undefined,
): Signal<T> {
  let byOverrides = MERGES.get(defaults);
  if (!byOverrides) {
    byOverrides = new WeakMap();
    MERGES.set(defaults, byOverrides);
  }
  const overridesKey: object = overrides ?? NO_OVERRIDES;
  const cached = byOverrides.get(overridesKey) as Signal<T> | undefined;
  if (cached) {
    return cached;
  }
  const defaultsSignal = coerceSignal(defaults);
  const overridesSignal = coerceSignal<Partial<T>>(overrides ?? {});
  const merged = computed<T>(() => ({ ...defaultsSignal(), ...overridesSignal() }), {
    equal: recordEqual,
  });
  byOverrides.set(overridesKey, merged);
  return merged;
}
