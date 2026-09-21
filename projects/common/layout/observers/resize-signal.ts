import { type DestroyRef, signal, type Signal } from '@angular/core';

/**
 * Structural window surface the resize helpers read: `window`, `globalThis`,
 * or a test double. `ResizeObserver` is optional so SSR and jsdom hosts pass
 * the type and hit the runtime guard instead.
 *
 * @category common/layout/observers
 * @since 0.3.0
 */
export interface ResizeObserverHost {
  ResizeObserver?: typeof ResizeObserver;
}

/**
 * Subscribes `apply` to size changes of `element` on `host`.
 *
 * Re-applies on every observation and returns the teardown that disconnects
 * the observer. On a host without `ResizeObserver` (SSR, jsdom) nothing is
 * wired, `apply` never fires, and the returned teardown is a no-op. Unlike the
 * media-query twin there is no synchronous seed: the first size is whatever the
 * observer reports after the next layout.
 *
 * Reach for this low-level form when the observed element or the box model is
 * reactive and the subscription must follow it (re-wire per `effect` run via
 * `onCleanup`); for a static target, {@link createResizeSignal} owns the
 * teardown via `DestroyRef`.
 *
 * @param host The window-like object to read `ResizeObserver` from.
 * @param element The element to observe.
 * @param box Which box model to report.
 * @param apply Receives the first entry of every observation batch.
 * @returns Teardown that disconnects the observer.
 * @category common/layout/observers
 * @relatedTo createResizeSignal, observeMediaQuery
 * @since 0.3.0
 */
export function observeResize(
  host: ResizeObserverHost | null | undefined,
  element: Element,
  box: ResizeObserverBoxOptions,
  apply: (entry: ResizeObserverEntry) => void,
): () => void {
  if (!host || typeof host.ResizeObserver !== 'function') {
    return () => undefined;
  }
  const observer = new host.ResizeObserver((entries) => apply(entries[0]));
  observer.observe(element, { box });
  return () => observer.disconnect();
}

/**
 * Creates a `Signal<ResizeObserverEntry | null>` that carries the most recent
 * observation of `element`, `null` until the first one arrives.
 *
 * Disconnects when `destroyRef` is destroyed. On a host without
 * `ResizeObserver` (SSR, jsdom) the signal stays `null` and no observer is
 * created, so it never throws off the browser.
 *
 * This is the shared kernel behind `CngxResizeObserver` and
 * `createContainerSize`; consumers that hand-roll a `ResizeObserver` should
 * route through it instead.
 *
 * ```typescript
 * const entry = createResizeSignal(
 *   host,
 *   'border-box',
 *   inject(DestroyRef),
 *   inject(DOCUMENT).defaultView,
 * );
 * const width = computed(() => entry()?.borderBoxSize[0]?.inlineSize ?? 0);
 * ```
 *
 * @param element The element to observe.
 * @param box Which box model to report.
 * @param destroyRef Scope whose destruction disconnects the observer.
 * @param host The window-like object to read `ResizeObserver` from.
 * @returns A readonly signal carrying the latest entry.
 * @category common/layout/observers
 * @relatedTo observeResize, createMediaQuerySignal
 * @since 0.3.0
 */
export function createResizeSignal(
  element: Element,
  box: ResizeObserverBoxOptions,
  destroyRef: DestroyRef,
  host: ResizeObserverHost | null | undefined,
): Signal<ResizeObserverEntry | null> {
  const entry = signal<ResizeObserverEntry | null>(null);
  const unsubscribe = observeResize(host, element, box, (value) => entry.set(value));
  destroyRef.onDestroy(unsubscribe);
  return entry.asReadonly();
}
