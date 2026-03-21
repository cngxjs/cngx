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

  private readonly _swiping = signal(false);
  private readonly _swipeProgress = signal(0);

  /** Whether a swipe gesture is currently in progress. */
  readonly swiping = this._swiping.asReadonly();
  /** Progress of the current swipe from 0 to 1 (clamped). */
  readonly swipeProgress = this._swipeProgress.asReadonly();

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    const nativeEl = el.nativeElement;

    const pointerDown$ = fromEvent<PointerEvent>(nativeEl, 'pointerdown');
    const pointerMove$ = fromEvent<PointerEvent>(document, 'pointermove');
    const pointerUp$ = fromEvent<PointerEvent>(document, 'pointerup');

    pointerDown$
      .pipe(
        filter(() => this.enabled()),
        switchMap((start) => {
          const startX = start.clientX;
          const startY = start.clientY;

          return pointerMove$.pipe(
            tap((move) => {
              const delta = this._getDelta(startX, startY, move.clientX, move.clientY);
              if (delta > 0) {
                this._swiping.set(true);
                this._swipeProgress.set(Math.min(1, delta / this.threshold()));
              }
            }),
            takeUntil(
              pointerUp$.pipe(
                map((end) => this._getDelta(startX, startY, end.clientX, end.clientY)),
                tap((delta) => {
                  if (delta >= this.threshold()) {
                    this.swiped.emit();
                  }
                  this._swiping.set(false);
                  this._swipeProgress.set(0);
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private _getDelta(startX: number, startY: number, endX: number, endY: number): number {
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
