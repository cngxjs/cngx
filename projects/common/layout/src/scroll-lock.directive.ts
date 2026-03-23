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
    const doc = inject(DOCUMENT);
    let prevOverflow = '';
    let prevScrollbarGutter = '';

    effect(() => {
      const html = doc.documentElement;
      if (this.enabled()) {
        prevOverflow = html.style.overflow;
        prevScrollbarGutter = html.style.scrollbarGutter;
        html.style.overflow = 'hidden';
        html.style.scrollbarGutter = 'stable';
      } else {
        html.style.overflow = prevOverflow;
        html.style.scrollbarGutter = prevScrollbarGutter;
      }
    });

    inject(DestroyRef).onDestroy(() => {
      const html = doc.documentElement;
      html.style.overflow = prevOverflow;
      html.style.scrollbarGutter = prevScrollbarGutter;
    });
  }
}
