import { computed, type Signal } from '@angular/core';

import { recordEqual } from '@cngx/utils';

import { coerceSignal } from './coerce.util';
import { CNGX_DEV_DESCRIPTORS } from './dev-descriptors';

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
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    CNGX_DEV_DESCRIPTORS.tag(merged, {
      kind: 'cngx-dev:override-merge',
      defaults: defaultsSignal,
      overrides: overridesSignal,
    });
  }
  byOverrides.set(overridesKey, merged);
  return merged;
}

/** The keys of `T` whose value is a plain record, not a primitive or a function. */
type RecordKeys<T> = {
  [P in keyof T]-?: NonNullable<T[P]> extends (...args: never[]) => unknown
    ? never
    : NonNullable<T[P]> extends object
      ? P
      : never;
}[keyof T];

/** `true` when `K` is a union of more than one key. */
type IsUnion<K, All = K> = K extends unknown ? ([All] extends [K] ? false : true) : never;

/**
 * The override shape {@link createNestedOverrideMerge} accepts: any subset of
 * the top-level keys, and any subset of the one nested record `K`.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo createNestedOverrideMerge
 */
export type CngxNestedOverrides<T, K extends RecordKeys<T>> = Partial<Omit<T, K>> & {
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
export function createNestedOverrideMerge<T extends object, K extends RecordKeys<T>>(
  defaults: T | Signal<T>,
  overrides: CngxNestedOverrides<T, K> | Signal<CngxNestedOverrides<T, K>> | undefined,
  key: true extends IsUnion<K> ? never : K,
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
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    CNGX_DEV_DESCRIPTORS.tag(merged, {
      kind: 'cngx-dev:nested-override-merge',
      defaults: defaultsSignal,
      overrides: overridesSignal,
      key,
    });
  }
  byKey.set(key, merged);
  return merged;
}

const FILLED = new WeakMap<Signal<object>, WeakMap<object, Map<PropertyKey, Signal<object>>>>();

/** No nested key: the fill memo's map key for a flat fill. */
const FLAT = Symbol('flat');

/** `record` with every key of `base` that `record` leaves nullish taken from `base`. */
function fillNullish<T extends object>(record: Partial<T>, base: T): T {
  const value = { ...record } as T;
  for (const name of Object.keys(base) as (keyof T)[]) {
    value[name] ??= base[name];
  }
  return value;
}

/**
 * Fills every key of `defaults` that a merged bundle leaves unset, so a
 * defaulted copy key an override sets to `undefined` falls back to its default
 * instead of rendering nothing. Pair it with {@link createOverrideMerge} or
 * {@link createNestedOverrideMerge}, whose plain spread lets an explicit
 * `undefined` win: the merge keeps the override rules, this restores the
 * default for keys that have one. Keys absent from `defaults` stay as merged.
 *
 * The one rule for unset values: a key is unset when its merged value is
 * `null` or `undefined` (`??`). Every other value, `''`, `0` and `false`
 * included, is a set value and wins.
 *
 * `defaults` may be a plain value or a `Signal` (a language-pack section
 * resolved at the reading site); the fill re-derives on either side's change.
 * Pass `key` for a bundle with one nested record (the same `key` as the
 * `createNestedOverrideMerge` it pairs with): the record is filled key by key
 * against `defaults[key]`, so an override that sets one nested key to
 * `undefined` reads that nested default.
 *
 * Memoized per (merged, defaults, key), and the result keeps its reference
 * while the filled values are equal - key-wise `recordEqual`, the nested
 * record compared key by key - so an accessor that fills the same merge for
 * every instance allocates nothing after the first and an equal recompute
 * does not re-run downstream readers.
 *
 * ```ts
 * export function injectTrailLabels(): Signal<Required<TrailLabels>> {
 *   return createDefaultsFill(
 *     createOverrideMerge(TRAIL_DEFAULTS, injectTrailConfig().labels),
 *     TRAIL_DEFAULTS,
 *   );
 * }
 * ```
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo createOverrideMerge, createNestedOverrideMerge
 */
export function createDefaultsFill<T extends object>(
  merged: Signal<Partial<T>>,
  defaults: T | Signal<T>,
): Signal<T>;
export function createDefaultsFill<T extends object, K extends RecordKeys<T>>(
  merged: Signal<Partial<T>>,
  defaults: T | Signal<T>,
  key: true extends IsUnion<K> ? never : K,
): Signal<T>;
export function createDefaultsFill<T extends object>(
  merged: Signal<Partial<T>>,
  defaults: T | Signal<T>,
  key?: keyof T,
): Signal<T> {
  let byDefaults = FILLED.get(merged);
  if (!byDefaults) {
    byDefaults = new WeakMap();
    FILLED.set(merged, byDefaults);
  }
  let byKey = byDefaults.get(defaults);
  if (!byKey) {
    byKey = new Map();
    byDefaults.set(defaults, byKey);
  }
  const cached = byKey.get(key ?? FLAT) as Signal<T> | undefined;
  if (cached) {
    return cached;
  }
  const defaultsSignal = coerceSignal(defaults);
  const filled =
    key === undefined
      ? computed<T>(() => fillNullish(merged(), defaultsSignal()), { equal: recordEqual })
      : computed<T>(
          () => {
            const base = defaultsSignal();
            const value = fillNullish(merged(), base);
            return {
              ...value,
              [key]: fillNullish((merged()[key] ?? {}) as object, base[key] as object),
            } as T;
          },
          { equal: nestedEqual<T>(key) },
        );
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    // The tag goes on the fill, never on `merged`: that one carries the inner
    // merge's own descriptor, which the fill's provenance chains to.
    CNGX_DEV_DESCRIPTORS.tag(filled, {
      kind: 'cngx-dev:defaults-fill',
      merged,
      defaults: defaultsSignal,
      key,
    });
  }
  byKey.set(key ?? FLAT, filled);
  return filled;
}

/**
 * A partial override bundle over a defaults bundle, every key the override
 * leaves unset, `null` or `undefined` reading the default: the
 * {@link createOverrideMerge} + {@link createDefaultsFill} pair in one call.
 * This is how a config copy sub-tree (override partials only) sits over the
 * language-pack section of the reading site.
 *
 * Memoized and reference-stable like the two calls it composes: the same
 * (defaults, overrides) pair returns the same signal.
 *
 * ```ts
 * export function injectTrailLabels(): Signal<TrailLabels> {
 *   return createFilledOverrideMerge(injectTrailSiteCopy(), injectTrailConfig().labels);
 * }
 * ```
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo createOverrideMerge, createDefaultsFill
 */
export function createFilledOverrideMerge<T extends object>(
  defaults: T | Signal<T>,
  overrides: Partial<T> | Signal<Partial<T>> | undefined,
): Signal<T> {
  return createDefaultsFill(createOverrideMerge<T>(defaults, overrides), defaults);
}
