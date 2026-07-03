import { computed, type Signal } from '@angular/core';

/**
 * Derives a controlled/uncontrolled source signal: a higher-precedence
 * `priority` source (an injected token signal, a projected template) wins over
 * a `fallback` source (a component `input()`). Collapses the repeated
 * `priority?.() ?? fallback()` seam - the "controlled input wins via `computed`"
 * pattern - into one factory beside its `create*` siblings.
 *
 * Pure pass-through: it returns whichever underlying signal's own value, never a
 * fresh literal, so an `equal` fn is unnecessary and no downstream cascade
 * fires. `priority` absent (no injected source) or yielding `undefined` (an
 * unbound input) both fall through to `fallback` - one expression covers the
 * accessor-absent seam (`source?.crumbs`) and the value-undefined seam
 * (`itemTemplateInput()`).
 *
 * @param priority Optional higher-precedence source. `undefined` when no source
 *   is present; a signal yielding `undefined` when the source is bound but empty.
 * @param fallback Lower-precedence source, read when `priority` is absent or
 *   yields `undefined`.
 * @returns A `computed` reading `priority?.() ?? fallback()`.
 *
 * ```ts
 * // an injected source wins over the [items] input, else the input shows
 * protected readonly items = createControlledSource(
 *   this.itemsSource?.crumbs, // injected source signal, may be absent
 *   this.itemsInput,          // [items] input - the fallback
 * );
 * ```
 *
 * @category core/utils
 * @since 0.1.0
 * @relatedTo createSelectionController, createTransitionTracker
 */
export function createControlledSource<T>(
  priority: Signal<T | undefined> | undefined,
  fallback: Signal<T>,
): Signal<T> {
  return computed(() => priority?.() ?? fallback());
}
