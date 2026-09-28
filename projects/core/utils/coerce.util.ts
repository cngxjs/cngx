import { isSignal, signal, type Signal } from '@angular/core';

/**
 * Coerces a value to a boolean.
 *
 * Strings are truthy unless they equal `'false'`.
 * All other falsy values return `false`.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function coerceBooleanProperty(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === 'string') {
    return value !== 'false';
  }

  return Boolean(value);
}

/**
 * Coerces a value to a number.
 *
 * Returns `fallback` when the value is null, undefined, NaN, or non-numeric.
 *
 * Strings parse leniently via `Number.parseFloat`: a leading numeric prefix
 * wins even when a unit trails it (`'12px'` coerces to `12`, `'1.5rem'` to
 * `1.5`). A string with no leading number (`'px12'`, `'true'`) returns
 * `fallback`. Booleans and objects are never numeric and return `fallback`.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function coerceNumberProperty(value: unknown, fallback = 0): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : value;
  }

  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number.NaN;

  return Number.isNaN(parsed) ? fallback : parsed;
}

const WRAPPED = new WeakMap<object, Signal<unknown>>();

/**
 * Coerces a value-or-signal into a signal, the way `coerceArray` coerces a
 * value-or-array into an array. A `Signal` passes through by reference. A
 * static object (or function) is wrapped once per reference, so every caller
 * handed the same object - every instance under one injector reading the same
 * token value - shares one readonly signal and nothing is allocated after the
 * first call. A primitive cannot key the cache and is wrapped fresh per call.
 *
 * `isSignal` checks Angular's signal brand, so a plain formatter function or a
 * bundle of them is wrapped as a value, never mistaken for a signal.
 *
 * Use it at a read site that must stay correct once a token starts carrying a
 * `Signal`: `private readonly i18n = coerceSignal(inject(TOKEN))`, then read
 * `i18n().x` inside a `computed()` or the template.
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo coerceBooleanProperty, coerceNumberProperty, createOverrideMerge
 */
export function coerceSignal<T>(source: T | Signal<T>): Signal<T> {
  if (isSignal(source)) {
    return source;
  }
  const cacheable = (typeof source === 'object' && source !== null) || typeof source === 'function';
  if (!cacheable) {
    return signal(source).asReadonly();
  }
  const key = source as object;
  const cached = WRAPPED.get(key) as Signal<T> | undefined;
  if (cached) {
    return cached;
  }
  const wrapped = signal(source).asReadonly();
  WRAPPED.set(key, wrapped);
  return wrapped;
}
