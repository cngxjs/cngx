// Step 2: scroll-observer.ts — addEventListener + ResizeObserver → signals

import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  type DestroyRef,
  type ElementRef,
  type Signal,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';

/**
 * Reactive scroll state of a container element.
 * Both signals are updated synchronously inside the same rAF callback —
 * Angular's Signal scheduling coalesces the two writes so consumers
 * evaluate once per frame, not twice.
 */
export interface ScrollState {
  readonly scrollTop: Signal<number>;
  readonly clientHeight: Signal<number>;
  /** The resolved scroll container element, or `null` if not yet resolved. */
  readonly element: Signal<HTMLElement | null>;
}

/**
 * Creates a reactive scroll observer for a container element.
 *
 * Element resolution happens **lazily inside the effect**, not at call time.
 * This is critical because `injectRecycler` is called in a field initializer
 * where template DOM does not yet exist — `querySelector` would return `null`.
 * The effect runs after the first CD cycle when the DOM is stable.
 *
 * @internal Not exported from `@cngx/common/data` public API.
 */
export function createScrollObserver(
  elementRef: ElementRef | HTMLElement | string,
  destroyRef: DestroyRef,
): ScrollState {
  const doc = inject(DOCUMENT);
  const scrollTopState = signal(0);
  const clientHeightState = signal(0);
  const elementState = signal<HTMLElement | null>(null);

  // Retry trigger — incremented by afterNextRender to re-run the effect
  // when the element wasn't found on the first attempt (routed components,
  // content projection, lazy rendering).
  const retryTick = signal(0);

  function attachListeners(el: HTMLElement, onCleanup: (fn: () => void) => void): void {
    elementState.set(el);
    scrollTopState.set(el.scrollTop);
    clientHeightState.set(el.clientHeight);

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId != null) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        scrollTopState.set(el.scrollTop);
        clientHeightState.set(el.clientHeight);
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      clientHeightState.set(el.clientHeight);
    });
    resizeObserver.observe(el);

    onCleanup(() => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
      elementState.set(null);
    });
  }

  effect((onCleanup) => {
    retryTick(); // tracked — effect re-runs when retryTick changes
    const el = resolveElement(elementRef, doc);
    if (!el) {
      return;
    }
    attachListeners(el, onCleanup);
  });

  // If the element wasn't found on the first effect run (before DOM is ready),
  // retry after the next render cycle. Fires for ALL input shapes — string
  // selectors resolve lazily via `querySelector`, but `ElementRef` from a
  // `viewChild` also starts out with `nativeElement == null` until Angular
  // resolves the query. `HTMLElement` inputs that are non-null at call time
  // short-circuit on the first effect run so the retry is a no-op.
  afterNextRender(() => {
    // untracked: afterNextRender may run in the same microtask as the effect.
    // Reading elementState() without untracked could create an unintended dependency
    // in whatever reactive context is active.
    if (untracked(() => elementState()) == null) {
      retryTick.update((v) => v + 1);
    }
  });

  // Additional cleanup via DestroyRef as safety net
  destroyRef.onDestroy(() => {
    elementState.set(null);
  });

  return {
    scrollTop: scrollTopState.asReadonly(),
    clientHeight: clientHeightState.asReadonly(),
    element: elementState.asReadonly(),
  };
}

function resolveElement(ref: ElementRef | HTMLElement | string, doc: Document): HTMLElement | null {
  if (typeof ref === 'string') {
    return doc.querySelector<HTMLElement>(ref);
  }
  if (ref instanceof HTMLElement) {
    return ref;
  }
  // ElementRef
  return (ref?.nativeElement as HTMLElement | null) ?? null;
}
