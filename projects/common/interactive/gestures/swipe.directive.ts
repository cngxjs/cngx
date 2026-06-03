import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, merge, switchMap, takeUntil, tap, filter, map } from 'rxjs';

import type { SwipeAxis, SwipeDirection } from './swipe-direction';

interface SwipeReading {
  readonly direction: SwipeDirection;
  readonly distance: number;
}

/**
 * Detects directional swipe gestures via Pointer Events and reports the
 * resolved direction.
 *
 * @category common/interactive/gestures
 *
 * Generic navigation atom: unlike {@link CngxSwipeDismiss} (one fixed
 * direction, dismiss intent), this emits `swiped` with the dominant
 * direction so a single host can drive bidirectional flows - carousels,
 * paged views, prev/next steppers. The `axis` input pins the gesture to
 * horizontal or vertical so an orthogonal scroll never fires it.
 * Exposes `swiping`, `swipeProgress`, and `swipeDirection` signals for
 * real-time feedback mid-gesture.
 *
 * ### Carousel: route left/right into a presenter
 * ```html
 * <section cngxSwipe axis="x" (swiped)="onSwipe($event)">…</section>
 * ```
 * ```ts
 * onSwipe(direction: SwipeDirection): void {
 *   if (direction === 'left') {
 *     this.next();
 *   } else if (direction === 'right') {
 *     this.previous();
 *   }
 * }
 * ```
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/gestures/swipe.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSwipeDismiss, CngxLongPress
 * <example-url>http://localhost:4200/#/ui/stepper/dot-stepper/mobile-carousel</example-url>
 */
@Directive({
  selector: '[cngxSwipe]',
  exportAs: 'cngxSwipe',
  standalone: true,
  host: {
    // Scope user-select suppression to the in-flight gesture. A
    // bare `user-select: none` on the host kills text selection
    // permanently inside the swipe surface even when the user is
    // just reading; gating on `swiping()` keeps the gesture-vs-
    // selection arbitration tight to the drag.
    '[style.user-select]': "swiping() ? 'none' : null",
    '[style.-webkit-user-select]': "swiping() ? 'none' : null",
  },
})
export class CngxSwipe {
  /** Minimum distance in px on the dominant axis to register a swipe. */
  readonly threshold = input<number>(50);
  /** Axis the gesture is allowed to register on. */
  readonly axis = input<SwipeAxis>('both');
  /** Whether the directive is active. */
  readonly enabled = input<boolean>(true);
  /** Emitted with the dominant direction when a swipe passes the threshold. */
  readonly swiped = output<SwipeDirection>();

  private readonly swipingState = signal(false);
  private readonly swipeProgressState = signal(0);
  private readonly swipeDirectionState = signal<SwipeDirection | null>(null);

  /** Whether a swipe gesture is currently in progress. */
  readonly swiping = this.swipingState.asReadonly();
  /** Progress of the current swipe from 0 to 1 (clamped). */
  readonly swipeProgress = this.swipeProgressState.asReadonly();
  /** Dominant direction of the in-flight gesture, or `null` when idle. */
  readonly swipeDirection = this.swipeDirectionState.asReadonly();

  constructor() {
    const nativeEl = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const doc = inject(DOCUMENT);

    const pointerDown$ = fromEvent<PointerEvent>(nativeEl, 'pointerdown');
    const pointerMove$ = fromEvent<PointerEvent>(doc, 'pointermove');
    const pointerUp$ = fromEvent<PointerEvent>(doc, 'pointerup');
    // pointercancel fires when the browser takes the pointer back
    // (system gesture, popup, JS-triggered focus loss). Without an
    // explicit arm the in-flight state would stay stuck at
    // `swiping = true` because pointerup never arrives.
    const pointerCancel$ = fromEvent<PointerEvent>(doc, 'pointercancel');

    const resetState = (pointerId: number | undefined): void => {
      if (pointerId !== undefined) {
        try {
          nativeEl.releasePointerCapture(pointerId);
        } catch {
          // releasePointerCapture throws when the pointer is no
          // longer captured (e.g. the browser already released it
          // before firing pointercancel) - safe to ignore.
        }
      }
      this.swipingState.set(false);
      this.swipeProgressState.set(0);
      this.swipeDirectionState.set(null);
    };

    pointerDown$
      .pipe(
        filter(() => this.enabled()),
        switchMap((start) => {
          const startX = start.clientX;
          const startY = start.clientY;
          const pointerId = start.pointerId;
          // Capture the pointer on the swipe host so subsequent
          // move / up events route here even when the cursor leaves
          // the original element (real mouse drags drift off the
          // panel into the strip / page chrome and would otherwise
          // skip the directive).
          try {
            nativeEl.setPointerCapture(pointerId);
          } catch {
            // setPointerCapture throws if pointerId is invalid (e.g.
            // synthetic event in some test envs) - safe to ignore.
          }

          const settle$ = merge(
            pointerUp$.pipe(
              map((end) => ({
                reading: this.read(startX, startY, end.clientX, end.clientY),
              })),
            ),
            pointerCancel$.pipe(map(() => ({ reading: null }))),
          );

          return pointerMove$.pipe(
            tap((move) => {
              const reading = this.read(startX, startY, move.clientX, move.clientY);
              if (reading) {
                this.swipingState.set(true);
                this.swipeDirectionState.set(reading.direction);
                this.swipeProgressState.set(Math.min(1, reading.distance / this.threshold()));
              }
            }),
            takeUntil(
              settle$.pipe(
                tap(({ reading }) => {
                  if (reading && reading.distance >= this.threshold()) {
                    this.swiped.emit(reading.direction);
                  }
                  resetState(pointerId);
                }),
              ),
            ),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /**
   * Resolve the dominant-axis direction + distance for a pointer delta,
   * or `null` when the gesture runs against the configured `axis`.
   */
  private read(startX: number, startY: number, endX: number, endY: number): SwipeReading | null {
    const dx = endX - startX;
    const dy = endY - startY;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const axis = this.axis();

    if (horizontal) {
      if (axis === 'y') {
        return null;
      }
      return { direction: dx < 0 ? 'left' : 'right', distance: Math.abs(dx) };
    }

    if (axis === 'x') {
      return null;
    }
    return { direction: dy < 0 ? 'up' : 'down', distance: Math.abs(dy) };
  }
}
