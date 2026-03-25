import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Communicates when a sticky-positioned element becomes stuck.
 *
 * This does NOT apply `position: sticky` — CSS handles that.
 * The directive adds a sentinel element before the host and uses
 * `IntersectionObserver` to detect when the sentinel scrolls out,
 * meaning the header is now stuck. Toggles a CSS class for shadow,
 * elevation, or background changes.
 *
 * @usageNotes
 *
 * ### Sticky header with shadow
 * ```html
 * <header cngxStickyHeader #sh="cngxStickyHeader"
 *         style="position: sticky; top: 0;">
 *   Page header
 * </header>
 * ```
 *
 * ```css
 * .cngx-sticky--active { box-shadow: 0 2px 4px rgba(0,0,0,.1); }
 * ```
 *
 * @category layout
 */
@Directive({
  selector: '[cngxStickyHeader]',
  exportAs: 'cngxStickyHeader',
  standalone: true,
  host: {
    '[class.cngx-sticky--active]': 'isSticky()',
  },
})
export class CngxStickyHeader {
  /** Intersection threshold — `0` triggers as soon as the sentinel leaves. */
  readonly threshold = input<number>(0);

  /** Emitted when the sticky state changes. */
  readonly stickyChange = output<boolean>();

  private readonly isStickyState = signal(false);
  /** Whether the header is currently in its stuck position. */
  readonly isSticky = this.isStickyState.asReadonly();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Sentinel + observer are created together after first render.
    // The sentinel is a 1px invisible element inserted before the host.
    // When it scrolls out of view, the header must be stuck.
    afterNextRender(() => {
      const host = this.el.nativeElement as HTMLElement;
      const sentinel = this.doc.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '1px';
      sentinel.style.marginBottom = '-1px';
      sentinel.style.visibility = 'hidden';
      sentinel.style.pointerEvents = 'none';
      sentinel.setAttribute('aria-hidden', 'true');
      host.parentElement?.insertBefore(sentinel, host);

      // Sentinel not intersecting = header is stuck (scrolled past its natural position).
      const observer = new IntersectionObserver(
        (entries) => {
          const isSticky = !entries[0].isIntersecting;
          if (isSticky !== this.isStickyState()) {
            this.isStickyState.set(isSticky);
            this.stickyChange.emit(isSticky);
          }
        },
        { threshold: this.threshold() },
      );

      observer.observe(sentinel);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        sentinel.remove();
      });
    });
  }
}
