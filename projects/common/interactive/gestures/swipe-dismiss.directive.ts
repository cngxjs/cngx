import { DOCUMENT } from '@angular/common';
import { computed, Directive, ElementRef, inject, input, output, signal } from '@angular/core';

import type { SwipeDirection } from './swipe-direction';
import { createSwipeEngine } from './swipe-engine';

/**
 * Detects directional swipe gestures via Pointer Events.
 *
 * @category common/interactive/gestures
 *
 * Generic atom usable for drawers (swipe-to-close), bottom sheets,
 * carousels, and dismissible cards. Emits `swiped` when the gesture
 * completes past the threshold. Exposes `swiping` and `swipeProgress`
 * signals for real-time visual feedback during the gesture.
 *
 * ### Close drawer on swipe-left
 * ```html
 * <nav [cngxDrawerPanel]="drawer"
 *      cngxSwipeDismiss="left" (swiped)="drawer.close()">
 *   …
 * </nav>
 * ```
 *
 * ### Bottom sheet with progress
 * ```html
 * <div cngxSwipeDismiss="down" #swipe="cngxSwipeDismiss"
 *      [style.transform]="'translateY(' + (swipe.swipeProgress() * 100) + '%)'">
 *   …
 * </div>
 * ```
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/gestures/swipe-dismiss.directive.ts
 * @since 0.1.0
 * @relatedTo CngxLongPress, CngxDrawer
 * <example-url>http://localhost:4200/#/common/interactive/gestures/swipe-dismiss/directional-swipe</example-url>
 */
@Directive({
  selector: '[cngxSwipeDismiss]',
  exportAs: 'cngxSwipeDismiss',
  standalone: true,
  host: {
    // Advertise the gesture's axis so the browser never claims the swipe
    // as a scroll; the orthogonal axis stays native (mirrors CngxSwipe).
    '[style.touch-action]': 'touchAction()',
    // Suppress text selection only while a gesture is in flight - a bare
    // user-select:none would kill selection even when the user is reading.
    '[style.user-select]': "swiping() ? 'none' : null",
    '[style.-webkit-user-select]': "swiping() ? 'none' : null",
  },
})
export class CngxSwipeDismiss {
  /** Direction of the swipe that triggers dismissal. */
  readonly direction = input.required<SwipeDirection>({ alias: 'cngxSwipeDismiss' });
  /** Minimum distance in px to register as a completed swipe. */
  readonly threshold = input<number>(50);
  /** Whether the directive is active. */
  readonly enabled = input<boolean>(true);
  /** Emitted when a swipe gesture completes past the threshold. */
  readonly swiped = output<void>();

  private readonly swipingState = signal(false);
  private readonly swipeProgressState = signal(0);

  /** Whether a swipe gesture is currently in progress. */
  readonly swiping = this.swipingState.asReadonly();
  /** Progress of the current swipe from 0 to 1 (clamped). */
  readonly swipeProgress = this.swipeProgressState.asReadonly();

  /**
   * The `touch-action` the host should advertise, derived from the dismiss
   * direction: a horizontal dismiss hands vertical panning back to native
   * scrolling and vice versa. No value is written while disabled.
   */
  protected readonly touchAction = computed<string | null>(() => {
    if (!this.enabled()) {
      return null;
    }
    const dir = this.direction();
    return dir === 'left' || dir === 'right' ? 'pan-y' : 'pan-x';
  });

  constructor() {
    const nativeEl = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const doc = inject(DOCUMENT);

    createSwipeEngine(nativeEl, doc, {
      enabled: () => this.enabled(),
      onMove: (dx, dy) => {
        const delta = this.getDelta(dx, dy);
        if (delta > 0) {
          this.swipingState.set(true);
          this.swipeProgressState.set(Math.min(1, delta / this.threshold()));
        }
      },
      onSettle: (settle) => {
        if (settle) {
          const delta = this.getDelta(settle.dx, settle.dy);
          if (delta >= this.threshold()) {
            this.swiped.emit();
          }
        }
        this.swipingState.set(false);
        this.swipeProgressState.set(0);
      },
    });
  }

  /** Signed delta along the dismiss direction; movement away from it is negative. */
  private getDelta(dx: number, dy: number): number {
    switch (this.direction()) {
      case 'left':
        return -dx;
      case 'right':
        return dx;
      case 'up':
        return -dy;
      case 'down':
        return dy;
    }
  }
}
