import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, signal, type Signal } from '@angular/core';

/**
 * Inject-form of {@link CngxMediaQuery}: returns a reactive
 * `Signal<boolean>` that reflects whether the host window currently matches
 * a CSS media query, without needing a host element.
 *
 * Use it where the directive form has nowhere to attach - inside a route
 * guard, a store, a `computed()`, or any injection context that reacts to a
 * viewport or preference query. For host-bound templates, prefer the
 * `[cngxMediaQuery]` directive; for pure styling, prefer CSS `@media` /
 * `@container`.
 *
 * Wraps `window.matchMedia()`: seeds the signal from `MediaQueryList.matches`,
 * updates on the `change` event, and removes the listener via `DestroyRef`
 * when the injection scope is destroyed. In SSR / non-DOM environments (no
 * `defaultView` or no `matchMedia`) it returns a static `false` signal and
 * wires no listener, so it never throws off the browser.
 *
 * Returns a `Signal<boolean>` - never an `Observable`; the reactive boundary
 * stays inside cngx.
 *
 * ```typescript
 * @Component({ … })
 * export class Dashboard {
 *   private readonly compact = injectMediaQuery('(max-width: 640px)');
 *   protected readonly layout = computed(() => (this.compact() ? 'stacked' : 'grid'));
 * }
 * ```
 *
 * @param query A CSS media query string, e.g. `(max-width: 640px)`.
 * @returns A reactive `Signal<boolean>` tracking the query's match state.
 * @category common/layout
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/observers/inject-media-query.ts
 * @since 0.1.0
 * @relatedTo CngxMediaQuery, CngxResizeObserver
 * <example-url>http://localhost:4200/#/common/layout/media-query/inject-breakpoint-signal</example-url>
 */
export function injectMediaQuery(query: string): Signal<boolean> {
  const win = inject(DOCUMENT).defaultView;
  if (!win || typeof win.matchMedia !== 'function') {
    return signal(false).asReadonly();
  }

  const mql = win.matchMedia(query);
  const matches = signal(mql.matches);
  const handler = (event: MediaQueryListEvent): void => matches.set(event.matches);
  mql.addEventListener('change', handler);
  inject(DestroyRef).onDestroy(() => mql.removeEventListener('change', handler));

  return matches.asReadonly();
}
