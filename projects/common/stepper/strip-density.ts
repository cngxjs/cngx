import { computed, signal, type DestroyRef, type Signal } from '@angular/core';

/**
 * Resolved density rung for the classic `<cngx-stepper>` strip.
 * `'full'` shows every label; `'compact'` ellipsis-truncates labels;
 * `'minimal'` drops to indicators-only (the active step keeps its
 * label). Orthogonal to the `mobileCollapse` display-mode union.
 *
 * @category common/stepper
 */
export type CngxStripDensity = 'full' | 'compact' | 'minimal';

/**
 * Options for {@link createStripDensity}.
 *
 * @internal
 */
export interface CngxStripDensityOptions {
  /** Strip container element whose width drives the density rung. */
  readonly element: HTMLElement;
  /** Current step-only count - the width budget is split across these. */
  readonly stepCount: () => number;
  /**
   * Resolved density policy. Only `'auto'` degrades; `'comfortable'`
   * (or `undefined`) short-circuits to `'full'`, preserving today's
   * behaviour.
   */
  readonly density: () => 'comfortable' | 'auto' | undefined;
  /**
   * Per-step width thresholds in px. At or above `compact` px per step
   * the strip stays `'full'`; at or above `minimal` it is `'compact'`;
   * below `minimal` it is `'minimal'`. `compact` must exceed `minimal`.
   */
  readonly breakpoints: () => { readonly compact: number; readonly minimal: number };
  readonly destroyRef: DestroyRef;
}

/**
 * Tracks an element's content-box width as a reactive signal via the
 * `ResizeObserver` API. Mirrors `createMobileViewportSignal`'s
 * `matchMedia` wrapper: the API is wrapped directly (not via the
 * `CngxResizeObserver` directive, which can only attach through
 * `hostDirectives`). In SSR / non-DOM environments the signal stays
 * `0` and no observer is wired.
 */
function createElementWidthSignal(element: HTMLElement, destroyRef: DestroyRef): Signal<number> {
  const width = signal(0);
  if (typeof ResizeObserver !== 'function') {
    return width.asReadonly();
  }
  const observer = new ResizeObserver((entries) => {
    width.set(entries[0]?.contentRect.width ?? 0);
  });
  observer.observe(element);
  destroyRef.onDestroy(() => observer.disconnect());
  return width.asReadonly();
}

/**
 * Resolves the classic strip's density rung from its own container
 * width against the step count and two per-step px thresholds. Pure
 * `create*` factory, sibling to `createStepperDisplayMode` - it owns a
 * `ResizeObserver` the way the display-mode factory owns a
 * `matchMedia` listener, and returns a single derived `Signal`.
 *
 * `'comfortable'` density short-circuits to `'full'` (no measurement
 * dependency). Before the first measurement (`width === 0`) and for an
 * empty strip the rung is `'full'`, so the strip never flashes
 * `'minimal'` on mount.
 *
 * @category common/stepper
 */
export function createStripDensity(options: CngxStripDensityOptions): Signal<CngxStripDensity> {
  const width = createElementWidthSignal(options.element, options.destroyRef);
  return computed<CngxStripDensity>(() => {
    if ((options.density() ?? 'comfortable') !== 'auto') {
      return 'full';
    }
    const count = options.stepCount();
    const measured = width();
    if (count === 0 || measured === 0) {
      return 'full';
    }
    const perStep = measured / count;
    const { compact, minimal } = options.breakpoints();
    if (perStep >= compact) {
      return 'full';
    }
    if (perStep >= minimal) {
      return 'compact';
    }
    return 'minimal';
  });
}
