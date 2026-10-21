import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, ElementRef, inject, type Signal } from '@angular/core';

import { createResizeSignal, type ResizeObserverHost } from '@cngx/common/layout';
import { createMediaQuerySignal, type MediaQueryHost } from '@cngx/core/utils';

/**
 * Window surface {@link createTouchFloorSignal} reads: `ResizeObserver`,
 * `matchMedia` and `getComputedStyle`. Each is optional so SSR and jsdom
 * hosts pass the type and take the fallback instead.
 *
 * @internal
 */
export type TouchFloorHost = ResizeObserverHost &
  MediaQueryHost &
  Partial<Pick<Window, 'getComputedStyle'>>;

/** The pointer query the coarse block of `system-tokens.css` lifts the floor on. */
const COARSE_POINTER_QUERY = '(any-pointer: coarse)';

/**
 * Whether the touch floor (`--cngx-target-min` above `0px`) is active on
 * `host`.
 *
 * The resolved custom property is the single source: the cascade already
 * folds every signal that sets the floor - `any-pointer: coarse`,
 * `data-touch="on"` / `.cngx-touch-on` and their `off` mirrors - and scopes
 * them per subtree. A JS re-derivation from `CNGX_TOUCH_TARGET` would miss
 * `[cngxTouchTarget]` and the classes.
 *
 * The read re-runs on every resize entry of `host` and on a flip of the
 * coarse-pointer query. A floor flip changes the trigger `min-height`, so the
 * host resizes and the value is re-read; the read is idempotent for an entry,
 * so the follow-up resize from the layout swap settles on the same value.
 * Before the first entry (first frame, SSR, jsdom) the coarse-pointer query
 * stands in, so a phone's first frame already takes the touch branch.
 *
 * Known limit: a runtime flip of a subtree `data-touch` that changes no box
 * size is picked up on the next resize only.
 *
 * @internal
 */
export function createTouchFloorSignal(
  host: Element,
  destroyRef: DestroyRef,
  win: TouchFloorHost | null | undefined,
): Signal<boolean> {
  const entry = createResizeSignal(host, 'border-box', destroyRef, win);
  const coarse = createMediaQuerySignal(COARSE_POINTER_QUERY, destroyRef, win);
  // A DOM read inside a computed() is deliberate, as in
  // `createContainerSize().property()`: the tracked dependencies are the
  // resize entry and the media query, and a ResizeObserver callback runs after
  // layout, so the read never forces a recalc of its own.
  return computed(() => {
    const isCoarse = coarse();
    if (entry() === null || typeof win?.getComputedStyle !== 'function') {
      return isCoarse;
    }
    const floor = Number.parseFloat(
      win.getComputedStyle(host).getPropertyValue('--cngx-target-min'),
    );
    return Number.isFinite(floor) && floor > 0;
  });
}

/**
 * {@link createTouchFloorSignal} over the injecting component's host element.
 * Injection context required.
 *
 * @internal
 */
export function injectTouchFloorSignal(): Signal<boolean> {
  return createTouchFloorSignal(
    inject(ElementRef).nativeElement as Element,
    inject(DestroyRef),
    inject(DOCUMENT).defaultView,
  );
}
