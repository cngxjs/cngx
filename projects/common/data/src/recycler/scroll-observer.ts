// Step 2: scroll-observer.ts — addEventListener + ResizeObserver → signals

import { DOCUMENT } from '@angular/common';
import {
  type DestroyRef,
  type ElementRef,
  type Signal,
  effect,
  inject,
  isDevMode,
  signal,
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

  effect((onCleanup) => {
    const el = resolveElement(elementRef, doc);
    if (!el) {
      if (isDevMode()) {
        console.warn(
          `[CngxRecycler] Scroll element not found: ${typeof elementRef === 'string' ? elementRef : '(ElementRef)'}. ` +
            `Recycler will not function until the element is available.`,
        );
      }
      return;
    }

    elementState.set(el);
    // Initial read
    scrollTopState.set(el.scrollTop);
    clientHeightState.set(el.clientHeight);

    // Scroll listener with rAF batching
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId != null) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = null;
        // Both writes in the same synchronous callback — Angular coalesces
        scrollTopState.set(el.scrollTop);
        clientHeightState.set(el.clientHeight);
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    // ResizeObserver for clientHeight changes (browser resize, mobile keyboard, font scaling)
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
