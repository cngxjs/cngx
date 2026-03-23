import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, inject, input } from '@angular/core';

/**
 * Prevents scrolling on the document body when enabled.
 *
 * Sets `overflow: hidden` and `scrollbar-gutter: stable` on `<html>` to
 * prevent layout shift when the scrollbar disappears. Restores original
 * values on disable or destroy.
 *
 * Reusable for any overlay: drawers, modals, dialogs, bottom sheets.
 *
 * @usageNotes
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
    const originalOverflow = html.style.overflow;
    const originalScrollbarGutter = html.style.scrollbarGutter;

    effect(() => {
      if (this.enabled()) {
        html.style.overflow = 'hidden';
        html.style.scrollbarGutter = 'stable';
      } else {
        html.style.overflow = originalOverflow;
        html.style.scrollbarGutter = originalScrollbarGutter;
      }
    });

    inject(DestroyRef).onDestroy(() => {
      html.style.overflow = originalOverflow;
      html.style.scrollbarGutter = originalScrollbarGutter;
    });
  }
}
