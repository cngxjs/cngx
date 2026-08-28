import { type DestroyRef, signal, type Signal } from '@angular/core';

/**
 * Structural window surface the media-query helpers read: `window`,
 * `globalThis`, or a test double. `matchMedia` is optional so SSR and
 * jsdom hosts pass the type and hit the runtime guard instead.
 *
 * @category core/utils/media-query
 * @since 0.3.0
 */
export interface MediaQueryHost {
  matchMedia?: (query: string) => MediaQueryList;
}

/**
 * Subscribes `apply` to a media query's match state on `host`.
 *
 * Seeds synchronously from `MediaQueryList.matches`, re-applies on every
 * `change` event, and returns the teardown that removes the listener. On a
 * host without `matchMedia` (SSR, jsdom) nothing is wired, `apply` never
 * fires, and the returned teardown is a no-op.
 *
 * Reach for this low-level form when the query itself is reactive and the
 * subscription must follow it (re-wire per `effect` run via `onCleanup`);
 * for a static query, {@link createMediaQuerySignal} owns the teardown via
 * `DestroyRef`.
 *
 * @param host The window-like object to read `matchMedia` from.
 * @param query A CSS media query string, e.g. `(max-width: 640px)`.
 * @param apply Receives the current match state, synchronously on subscribe and on every change.
 * @returns Teardown that removes the change listener.
 * @category core/utils/media-query
 * @relatedTo createMediaQuerySignal
 * @since 0.3.0
 */
export function observeMediaQuery(
  host: MediaQueryHost | null | undefined,
  query: string,
  apply: (matches: boolean) => void,
): () => void {
  if (!host || typeof host.matchMedia !== 'function') {
    return () => undefined;
  }
  const mql = host.matchMedia(query);
  apply(mql.matches);
  const listener = (event: MediaQueryListEvent): void => apply(event.matches);
  mql.addEventListener('change', listener);
  return () => mql.removeEventListener('change', listener);
}

/**
 * Creates a reactive `Signal<boolean>` that reflects whether `host`
 * currently matches a CSS media query.
 *
 * Seeds from `MediaQueryList.matches`, updates on the `change` event, and
 * removes the listener when `destroyRef` is destroyed. On a host without
 * `matchMedia` (SSR, jsdom) the signal stays `false` and no listener is
 * wired, so it never throws off the browser.
 *
 * This is the shared kernel behind `injectMediaQuery`, `CngxMediaQuery`,
 * `CngxSkeleton`, `CngxReducedMotion`, and the stepper's mobile-viewport
 * signal; consumers that hand-roll a `matchMedia` listener should route
 * through it instead.
 *
 * ```typescript
 * const compact = createMediaQuerySignal(
 *   '(max-width: 640px)',
 *   inject(DestroyRef),
 *   inject(DOCUMENT).defaultView,
 * );
 * ```
 *
 * @param query A CSS media query string, e.g. `(max-width: 640px)`.
 * @param destroyRef Scope whose destruction removes the change listener.
 * @param host The window-like object to read `matchMedia` from.
 * @returns A readonly `Signal<boolean>` tracking the query's match state.
 * @category core/utils/media-query
 * @relatedTo observeMediaQuery
 * @since 0.3.0
 */
export function createMediaQuerySignal(
  query: string,
  destroyRef: DestroyRef,
  host: MediaQueryHost | null | undefined,
): Signal<boolean> {
  const matches = signal(false);
  const unsubscribe = observeMediaQuery(host, query, (value) => matches.set(value));
  destroyRef.onDestroy(unsubscribe);
  return matches.asReadonly();
}
