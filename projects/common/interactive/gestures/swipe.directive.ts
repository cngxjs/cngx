import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, switchMap, takeUntil, tap, filter, map } from 'rxjs';

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

    pointerDown$
      .pipe(
        filter(() => this.enabled()),
        switchMap((start) => {
          const startX = start.clientX;
          const startY = start.clientY;

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
              pointerUp$.pipe(
                map((end) => this.read(startX, startY, end.clientX, end.clientY)),
                tap((reading) => {
                  if (reading && reading.distance >= this.threshold()) {
                    this.swiped.emit(reading.direction);
                  }
                  this.swipingState.set(false);
                  this.swipeProgressState.set(0);
                  this.swipeDirectionState.set(null);
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
