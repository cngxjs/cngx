import {
  type DestroyRef,
  effect,
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
  /** Host element the live-region span is appended to as a child. */
  readonly hostEl: HTMLElement;
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
 * Mount a polite ARIA live region as a child of the supplied host
 * element and keep its `textContent` in sync with the supplied
 * `announcement` signal. Empty string between transitions so AT
 * readers stay quiet on no-op CD ticks.
 *
 * The element replicates the {@link CngxLiveRegion} directive's
 * host bindings imperatively (the directive cannot be applied
 * declaratively from an attribute directive that owns no template).
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
  const liveRegionEl = opts.renderer.createElement('span') as HTMLElement;
  opts.renderer.addClass(liveRegionEl, srOnlyClassName);
  opts.renderer.setAttribute(liveRegionEl, 'aria-live', politeness);
  opts.renderer.setAttribute(liveRegionEl, 'aria-atomic', 'true');
  opts.renderer.setAttribute(liveRegionEl, 'aria-relevant', 'additions text');
  opts.renderer.setAttribute(liveRegionEl, 'role', role);
  opts.renderer.appendChild(opts.hostEl, liveRegionEl);

  runInInjectionContext(opts.injector, () => {
    effect(() => {
      const text = opts.announcement();
      untracked(() => {
        opts.renderer.setProperty(liveRegionEl, 'textContent', text);
      });
    });
  });

  opts.destroyRef.onDestroy(() => {
    opts.renderer.removeChild(opts.hostEl, liveRegionEl);
  });
}
