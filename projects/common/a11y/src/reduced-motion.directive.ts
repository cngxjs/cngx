import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, inject, signal, type Signal } from '@angular/core';

/**
 * Reflects the user's `prefers-reduced-motion` media query as a reactive signal.
 *
 * Adds the `cngx-reduced-motion` CSS class to the host when the user prefers
 * reduced motion. The `prefersReducedMotion()` signal updates live when the
 * OS preference changes — use it in TypeScript to skip animations, disable
 * auto-playing media, or choose between animated and instant transitions.
 *
 * Unlike a CSS-only `@media (prefers-reduced-motion: reduce)` approach, this
 * directive makes the preference available in component logic (e.g., to pick
 * a different animation strategy or suppress requestAnimationFrame loops).
 *
 * @usageNotes
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
 */
@Directive({
  selector: '[cngxReducedMotion]',
  exportAs: 'cngxReducedMotion',
  standalone: true,
  host: { '[class.cngx-reduced-motion]': 'prefersReducedMotion()' },
})
export class CngxReducedMotion {
  /** `true` when the user's OS is set to prefer reduced motion. Updates reactively. */
  readonly prefersReducedMotion: Signal<boolean>;

  constructor() {
    const mq = inject(DOCUMENT).defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
    const _pref = signal(mq.matches);
    const listener = (e: MediaQueryListEvent) => _pref.set(e.matches);
    mq.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', listener));
    this.prefersReducedMotion = _pref.asReadonly();
  }
}
