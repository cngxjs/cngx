import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, inject, input } from '@angular/core';

import { createScrollLock } from './scroll-lock-core';

/**
 * Prevents scrolling on the document, or on a given scroll container, when
 * enabled.
 *
 * Sets `overflow: hidden` and `scrollbar-gutter: stable` on the target
 * (`<html>` unless `[cngxScrollLockTarget]` names another element) to
 * prevent layout shift when the scrollbar disappears. Restores original
 * values when all lock instances on that target are released.
 *
 * Multiple instances are ref-counted per target - the original styles are
 * only restored when the last lock on that element is released.
 *
 * ### With a drawer
 * ```html
 * <div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
 *   …
 * </div>
 * ```
 *
 * ### With a modal
 * ```html
 * <div [cngxScrollLock]="isModalOpen()">…</div>
 * ```
 *
 * ### Inside a scroll container
 * ```html
 * <section #pane class="pane">
 *   <aside [cngxScrollLock]="open()" [cngxScrollLockTarget]="pane">…</aside>
 * </section>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-lock.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxBackdrop
 * <example-url>/#/common/layout/scroll-lock/toggle</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxScrollLock]',
  exportAs: 'cngxScrollLock',
  standalone: true,
})
export class CngxScrollLock {
  /** Whether scroll lock is active. */
  readonly enabled = input<boolean>(false, { alias: 'cngxScrollLock' });
  /**
   * The scrolling element to lock. Defaults to the document root
   * (`document.documentElement`). Changing it while locked moves the lock.
   */
  readonly target = input<HTMLElement | null | undefined>(undefined, {
    alias: 'cngxScrollLockTarget',
  });

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    let locked: HTMLElement | null = null;
    let release: (() => void) | null = null;

    effect(() => {
      const wanted = this.enabled() ? (this.target() ?? root) : null;
      if (wanted === locked) {
        return;
      }
      release?.();
      release = wanted ? createScrollLock(wanted) : null;
      locked = wanted;
    });

    inject(DestroyRef).onDestroy(() => {
      release?.();
    });
  }
}
