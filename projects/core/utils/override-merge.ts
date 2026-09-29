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

/**
 * The override shape {@link createNestedOverrideMerge} accepts: any subset of
 * the top-level keys, and any subset of the one nested record `K`.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo createNestedOverrideMerge
 */
export type CngxNestedOverrides<T, K extends keyof T> = Partial<Omit<T, K>> & {
  readonly [P in K]?: Partial<T[P]>;
};

const NESTED_MERGES = new WeakMap<object, WeakMap<object, Map<PropertyKey, Signal<object>>>>();

/**
 * `Object.is` per top-level key, except `key`, which compares key by key: the
 * nested record is rebuilt on every merge, so a reference check would call
 * every recompute a change.
 */
function nestedEqual<T extends object>(key: keyof T): (a: T, b: T) => boolean {
  return (a, b) => {
    if (!recordEqual({ ...a, [key]: undefined }, { ...b, [key]: undefined })) {
      return false;
    }
    return recordEqual(a[key] as object, b[key] as object);
  };
}

/**
 * {@link createOverrideMerge} for a bundle with one nested record, such as a
 * `statusLabels` map inside an i18n bundle: the top level merges like a plain
 * spread, and `key` merges key by key, so an override that sets one nested
 * label keeps the other nested defaults. Either side may be a plain value or
 * a `Signal`; the merge re-derives on either side's change.
 *
 * The result keeps its reference while the merged values are equal - top-level
 * keys by `Object.is`, the nested record by `recordEqual` - so re-setting an
 * override to a new but equal object does not re-run downstream readers.
 * Memoized per (defaults, overrides, key) like `createOverrideMerge`.
 *
 * One nesting level only, and the same spread rule as `createOverrideMerge`: a
 * key present in the override wins even when its value is `undefined`.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo createOverrideMerge, coerceSignal, CngxNestedOverrides
 */
export function createNestedOverrideMerge<T extends object, K extends keyof T>(
  defaults: T | Signal<T>,
  overrides: CngxNestedOverrides<T, K> | Signal<CngxNestedOverrides<T, K>> | undefined,
  key: K,
): Signal<T> {
  let byOverrides = NESTED_MERGES.get(defaults);
  if (!byOverrides) {
    byOverrides = new WeakMap();
    NESTED_MERGES.set(defaults, byOverrides);
  }
  const overridesKey: object = overrides ?? NO_OVERRIDES;
  let byKey = byOverrides.get(overridesKey);
  if (!byKey) {
    byKey = new Map();
    byOverrides.set(overridesKey, byKey);
  }
  const cached = byKey.get(key) as Signal<T> | undefined;
  if (cached) {
    return cached;
  }
  const defaultsSignal = coerceSignal(defaults);
  const overridesSignal = coerceSignal<CngxNestedOverrides<T, K>>(overrides ?? {});
  const merged = computed<T>(
    () => {
      const base = defaultsSignal();
      const patch = overridesSignal();
      return {
        ...base,
        ...patch,
        [key]: { ...(base[key] as object), ...(patch[key] as object | undefined) },
      } as T;
    },
    { equal: nestedEqual<T>(key) },
  );
  byKey.set(key, merged);
  return merged;
}
