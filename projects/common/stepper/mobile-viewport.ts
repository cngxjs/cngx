import { computed, signal, type DestroyRef, type Signal } from '@angular/core';

import type { CngxStepperMobileCollapse } from './stepper-config';

/**
 * Returns a reactive `Signal<boolean>` that reflects whether the host
 * window matches a CSS media query (e.g. `(max-width: 480px)`). Used by
 * `<cngx-stepper>` to drive its mobile auto-collapse template branch.
 *
 * In SSR / non-DOM environments the signal stays `false` and the
 * listener is never wired.
 *
 * @category common/stepper
 */
export function createMobileViewportSignal(
  mediaQuery: string,
  destroyRef: DestroyRef,
): Signal<boolean> {
  const matches = signal<boolean>(false);
  if (typeof globalThis.matchMedia !== 'function') {
    return matches.asReadonly();
  }
  const mql = globalThis.matchMedia(mediaQuery);
  matches.set(mql.matches);
  const listener = (event: MediaQueryListEvent): void => matches.set(event.matches);
  mql.addEventListener('change', listener);
  destroyRef.onDestroy(() => mql.removeEventListener('change', listener));
  return matches.asReadonly();
}

/**
 * Resolves the active stepper display mode by combining a viewport
 * media-query with the configured `mobileCollapse` policy.
 * `'classic'` keeps the full strip; `'text'` / `'dots'` swap to the
 * matching compact variant.
 *
 * @category common/stepper
 */
export function createStepperDisplayMode(
  mediaQuery: string,
  mobileCollapse: () => CngxStepperMobileCollapse | undefined,
  destroyRef: DestroyRef,
): Signal<'classic' | 'text' | 'dots'> {
  const viewport = createMobileViewportSignal(mediaQuery, destroyRef);
  return computed(() => {
    if (!viewport()) {
      return 'classic';
    }
    const mode = mobileCollapse() ?? 'text';
    return mode === 'off' ? 'classic' : mode;
  });
}
