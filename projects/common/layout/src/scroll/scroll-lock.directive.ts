import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, inject, input } from '@angular/core';

/** Shared ref-count for scroll lock instances on the same document. */
const lockCounts = new WeakMap<HTMLElement, number>();

function acquireScrollLock(html: HTMLElement): void {
  const count = lockCounts.get(html) ?? 0;
  if (count === 0) {
    html.dataset['cngxPrevOverflow'] = html.style.overflow;
    html.dataset['cngxPrevScrollbarGutter'] = html.style.scrollbarGutter;
    html.style.overflow = 'hidden';
    html.style.scrollbarGutter = 'stable';
  }
  lockCounts.set(html, count + 1);
}

function releaseScrollLock(html: HTMLElement): void {
  const count = lockCounts.get(html) ?? 0;
  if (count <= 1) {
    html.style.overflow = html.dataset['cngxPrevOverflow'] ?? '';
    html.style.scrollbarGutter = html.dataset['cngxPrevScrollbarGutter'] ?? '';
    delete html.dataset['cngxPrevOverflow'];
    delete html.dataset['cngxPrevScrollbarGutter'];
    lockCounts.set(html, 0);
  } else {
    lockCounts.set(html, count - 1);
  }
}

/**
 * Prevents scrolling on the document body when enabled.
 *
 * Sets `overflow: hidden` and `scrollbar-gutter: stable` on `<html>` to
 * prevent layout shift when the scrollbar disappears. Restores original
 * values when all lock instances are released.
 *
 * Multiple instances are ref-counted — the original styles are only
 * restored when the last lock is released.
 *
 * @category layout
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
    let locked = false;

    effect(() => {
      if (this.enabled() && !locked) {
        acquireScrollLock(html);
        locked = true;
      } else if (!this.enabled() && locked) {
        releaseScrollLock(html);
        locked = false;
      }
    });

    inject(DestroyRef).onDestroy(() => {
      if (locked) {
        releaseScrollLock(html);
      }
    });
  }
}
