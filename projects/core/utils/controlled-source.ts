import { computed, type Signal } from '@angular/core';

/**
 * Derives a controlled/uncontrolled source signal: a higher-precedence
 * `priority` source wins over a lower-precedence `fallback` source. Precedence
 * is the only contract - either argument may be an injected token signal, a
 * component `input()`, or a projected `contentChild` query, and which role a
 * given source plays flips per seam (the bar lets an injected source win over
 * its `[items]` input; the overflow lets a forwarded `input()` win over its
 * projected slot query). Collapses the repeated `priority?.() ?? fallback()`
 * seam - the "controlled source wins via `computed`" pattern - into one factory
 * beside its `create*` siblings.
 *
 * Pure pass-through: it returns whichever underlying signal's own value, never a
 * fresh literal, so an `equal` fn is unnecessary and no downstream cascade
 * fires. `priority` absent (no source injected) or yielding `undefined` (an
 * unbound input, an unmatched query) both fall through to `fallback` - one
 * expression covers the accessor-absent seam (`source?.crumbs`) and the
 * value-undefined seam (`itemTemplateInput()`).
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
