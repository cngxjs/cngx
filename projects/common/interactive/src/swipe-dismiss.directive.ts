import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, switchMap, takeUntil, tap, filter, map } from 'rxjs';

/** Swipe direction — matches drawer positions for natural composition. */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Detects directional swipe gestures via Pointer Events.
 *
 * Generic atom usable for drawers (swipe-to-close), bottom sheets,
 * carousels, and dismissible cards. Emits `swiped` when the gesture
 * completes past the threshold. Exposes `swiping` and `swipeProgress`
 * signals for real-time visual feedback during the gesture.
 *
 * @usageNotes
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
 */
@Directive({
  selector: '[cngxSwipeDismiss]',
  exportAs: 'cngxSwipeDismiss',
  standalone: true,
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

  constructor() {
    const nativeEl = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const doc = inject(DOCUMENT);

    const pointerDown$ = fromEvent<PointerEvent>(nativeEl, 'pointerdown');
    const pointerMove$ = fromEvent<PointerEvent>(doc, 'pointermove');
    const pointerUp$ = fromEvent<PointerEvent>(doc, 'pointerup');

    pointerDown$
      .pipe(
        filter(() => this.enabled()),
        switchMap((start) => {
          const startX = start.clientX;
          const startY = start.clientY;

          return pointerMove$.pipe(
            tap((move) => {
              const delta = this.getDelta(startX, startY, move.clientX, move.clientY);
              if (delta > 0) {
                this.swipingState.set(true);
                this.swipeProgressState.set(Math.min(1, delta / this.threshold()));
              }
            }),
            takeUntil(
              pointerUp$.pipe(
                map((end) => this.getDelta(startX, startY, end.clientX, end.clientY)),
                tap((delta) => {
                  if (delta >= this.threshold()) {
                    this.swiped.emit();
                  }
                  this.swipingState.set(false);
                  this.swipeProgressState.set(0);
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private getDelta(startX: number, startY: number, endX: number, endY: number): number {
    const dir = this.direction();
    switch (dir) {
      case 'left':
        return startX - endX;
      case 'right':
        return endX - startX;
      case 'up':
        return startY - endY;
      case 'down':
        return endY - startY;
    }
  }
}
