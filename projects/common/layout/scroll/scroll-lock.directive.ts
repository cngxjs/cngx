import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, inject, input } from '@angular/core';

import { createScrollLock } from './scroll-lock-core';

/**
 * Prevents scrolling on the document body when enabled.
 *
 * Sets `overflow: hidden` and `scrollbar-gutter: stable` on `<html>` to
 * prevent layout shift when the scrollbar disappears. Restores original
 * values when all lock instances are released.
 *
 * Multiple instances are ref-counted - the original styles are only
 * restored when the last lock is released.
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
 * @category common/layout
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-lock.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDrawer, CngxBackdrop
 * <example-url>http://localhost:4200/#/common/layout/scroll-lock/toggle</example-url>
 */
@Directive({
  selector: '[cngxScrollLock]',
  exportAs: 'cngxScrollLock',
  standalone: true,
})
export class CngxScrollLock {
  /** Whether scroll lock is active. */
  readonly enabled = input<boolean>(false, { alias: 'cngxScrollLock' });

  constructor() {
    const html = inject(DOCUMENT).documentElement;
    let release: (() => void) | null = null;

    effect(() => {
      if (this.enabled() && !release) {
        release = createScrollLock(html);
      } else if (!this.enabled() && release) {
        release();
        release = null;
      }
    });

    inject(DestroyRef).onDestroy(() => {
      release?.();
    });
  }
}
