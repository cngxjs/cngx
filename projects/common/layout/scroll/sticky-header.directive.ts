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
 * Applies `position: sticky; top: 0` on the host automatically.
 * The directive adds a sentinel element before the host and uses
 * `IntersectionObserver` to detect when the sentinel scrolls out,
 * meaning the header is now stuck. Toggles a CSS class for shadow,
 * elevation, or background changes.
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
 * @category common/layout
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/sticky-header.directive.ts
 * @since 0.1.0
 * @relatedTo CngxScrollSpy, CngxIntersectionObserver
 * <example-url>http://localhost:4200/#/common/layout/sticky-header/sticky-header-with-shadow</example-url>
 */
@Directive({
  selector: '[cngxStickyHeader]',
  exportAs: 'cngxStickyHeader',
  standalone: true,
  host: {
    style: 'position: sticky; top: 0; z-index: var(--cngx-sticky-z-index, 1)',
    '[class.cngx-sticky--active]': 'isSticky()',
  },
})
export class CngxStickyHeader {
  /** Intersection threshold - `0` triggers as soon as the sentinel leaves. */
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

    // IntersectionObserver sentinel pattern - host is stuck once the 1px sentinel leaves
    // the scrollport the host actually sticks to.
    afterNextRender(() => {
      const host = this.el.nativeElement as HTMLElement;
      // Root the sentinel at the scrollport `position: sticky` resolves against, not the
      // viewport. Observing against the viewport reports a different thing entirely: a
      // header inside a never-scrolling scrollport would read `isSticky() === true` while
      // it visibly scrolls away with its content.
      const scrollport = this.resolveScrollParent(host);

      const sentinel = this.doc.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '1px';
      sentinel.style.marginBottom = '-1px';
      sentinel.style.visibility = 'hidden';
      sentinel.style.pointerEvents = 'none';
      sentinel.setAttribute('aria-hidden', 'true');
      host.parentElement?.insertBefore(sentinel, host);

      const observer = new IntersectionObserver(
        (entries) => {
          const isSticky = !entries[0].isIntersecting;
          if (isSticky !== this.isStickyState()) {
            this.isStickyState.set(isSticky);
            this.stickyChange.emit(isSticky);
          }
        },
        { threshold: this.threshold(), root: scrollport },
      );

      observer.observe(sentinel);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        sentinel.remove();
      });
    });
  }

  /**
   * The nearest ancestor that is a scroll container in the block axis - the scrollport
   * `position: sticky` resolves against. Walks up from the host's parent to the first
   * ancestor whose computed `overflow-y` is not `visible`; `null` means no such
   * ancestor, i.e. the header sticks to the viewport. A used `overflow-x` other than
   * `visible` coerces the computed `overflow-y` to `auto`, so this also catches a
   * horizontal scroll container (e.g. a data grid that scrolls sideways).
   */
  private resolveScrollParent(host: HTMLElement): HTMLElement | null {
    const view = this.doc.defaultView;
    for (let node = host.parentElement; node; node = node.parentElement) {
      const overflowY = view?.getComputedStyle(node).overflowY;
      if (overflowY && overflowY !== 'visible') {
        return node;
      }
    }
    return null;
  }
}
