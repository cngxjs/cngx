import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, inject, type Signal } from '@angular/core';
import { createMediaQuerySignal } from '@cngx/core/utils';

/**
 * Reflects the user's `prefers-reduced-motion` media query as a reactive signal.
 *
 * Adds the `cngx-reduced-motion` CSS class to the host when the user prefers
 * reduced motion. The `prefersReducedMotion()` signal updates live when the
 * OS preference changes - use it in TypeScript to skip animations, disable
 * auto-playing media, or choose between animated and instant transitions.
 *
 * Unlike a CSS-only `@media (prefers-reduced-motion: reduce)` approach, this
 * directive makes the preference available in component logic (e.g., to pick
 * a different animation strategy or suppress requestAnimationFrame loops).
 *
 * This is the OS preference only. An in-app pick through `provideMotion` /
 * `injectMotion` (`CNGX_MOTION`, `<html data-motion>`) is not seen here; to
 * decide on the motion the user actually gets, read `injectEffectiveMotion()`
 * from `@cngx/core` instead.
 *
 * ### Conditional animation
 * ```html
 * <div cngxReducedMotion #rm="cngxReducedMotion"
 *      [style.animation]="rm.prefersReducedMotion() ? 'none' : 'spin 2s linear infinite'">
 * </div>
 * ```
 *
 * ### TypeScript logic
 * ```typescript
 * readonly rm = viewChild(CngxReducedMotion);
 * readonly duration = computed(() => this.rm()?.prefersReducedMotion() ? 0 : 300);
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/a11y/motion/reduced-motion.directive.ts
 * @since 0.3.0
 * <example-url>/#/common/a11y/reduced-motion/animation-toggle</example-url>
 * <example-url>/#/common/a11y/reduced-motion/toast-notifications-motion-aware</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxReducedMotion]',
  exportAs: 'cngxReducedMotion',
  standalone: true,
  host: { '[class.cngx-reduced-motion]': 'prefersReducedMotion()' },
})
export class CngxReducedMotion {
  /** `true` when the user's OS is set to prefer reduced motion (ignores `CNGX_MOTION`). Updates reactively. */
  readonly prefersReducedMotion: Signal<boolean>;

  constructor() {
    this.prefersReducedMotion = createMediaQuerySignal(
      '(prefers-reduced-motion: reduce)',
      inject(DestroyRef),
      inject(DOCUMENT).defaultView,
    );
  }
}
