import { DOCUMENT } from '@angular/common';
import {
  type DestroyRef,
  effect,
  inject,
  type Injector,
  type Renderer2,
  runInInjectionContext,
  type Signal,
  untracked,
} from '@angular/core';

/**
 * Options for {@link mountLiveRegionAnnouncer}.
 *
 * @internal
 */
export interface CngxMatTabLiveRegionOptions {
  /** Reactive announcement text. Empty string keeps the region quiet. */
  readonly announcement: Signal<string>;
  readonly renderer: Renderer2;
  readonly injector: Injector;
  readonly destroyRef: DestroyRef;
  /** Default: `'cngx-sr-only'`. */
  readonly srOnlyClassName?: string;
  /** Default: `'polite'`. */
  readonly politeness?: 'polite' | 'assertive';
}

/**
 * Mount a polite ARIA live region under `document.body` and keep
 * its `textContent` in sync with the supplied `announcement`
 * signal. Empty string between transitions so AT readers stay quiet
 * on no-op CD ticks.
 *
 * The span lives at body scope (matching the CDK `LiveAnnouncer`
 * placement convention) so Material's MDC tolerance for unexpected
 * children at the `<mat-tab-group>` host root is irrelevant — the
 * live-region never lands inside Material's component DOM. The
 * element's host bindings replicate {@link CngxLiveRegion}
 * imperatively (this attribute directive owns no template, so the
 * declarative `cngxLiveRegion` selector is unreachable). The
 * duplication of `CngxLiveRegion`'s host-binding shape is
 * acknowledged debt — `tabs-accepted-debt §12` covers the
 * single-consumer family-uniformity staging and the Re-Eval
 * Triggers that would graduate this helper to a
 * `CNGX_MAT_TAB_LIVE_ANNOUNCER_FACTORY` swap surface.
 * Cleaned up via the supplied `DestroyRef`.
 *
 * @internal — package-private helper for `[cngxMatTabs]`. Not
 * exported from `public-api.ts`.
 */
export function mountLiveRegionAnnouncer(
  opts: CngxMatTabLiveRegionOptions,
): void {
  const srOnlyClassName = opts.srOnlyClassName ?? 'cngx-sr-only';
  const politeness = opts.politeness ?? 'polite';
  const role = politeness === 'assertive' ? 'alert' : 'status';
  const doc = runInInjectionContext(opts.injector, () => inject(DOCUMENT));
  const liveRegionEl = opts.renderer.createElement('span') as HTMLElement;
  opts.renderer.addClass(liveRegionEl, srOnlyClassName);
  opts.renderer.setAttribute(liveRegionEl, 'aria-live', politeness);
  opts.renderer.setAttribute(liveRegionEl, 'aria-atomic', 'true');
  opts.renderer.setAttribute(liveRegionEl, 'aria-relevant', 'additions text');
  opts.renderer.setAttribute(liveRegionEl, 'role', role);
  opts.renderer.appendChild(doc.body, liveRegionEl);

  runInInjectionContext(opts.injector, () => {
    effect(() => {
      const text = opts.announcement();
      untracked(() => {
        opts.renderer.setProperty(liveRegionEl, 'textContent', text);
      });
    });
  });

  opts.destroyRef.onDestroy(() => {
    opts.renderer.removeChild(doc.body, liveRegionEl);
  });
}
