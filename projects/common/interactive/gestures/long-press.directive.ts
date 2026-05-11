import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, filter, switchMap, takeUntil, timer, tap, merge } from 'rxjs';

/**
 * Detects long-press gestures via Pointer Events.
 *
 * Fires `longPressed` after the pointer is held down for the `threshold` duration
 * without moving more than 10px. Cancels on pointer move (prevents accidental
 * triggers during scrolling), pointer up, pointer cancel, and pointer leave.
 *
 * Exposes `longPressing` signal for real-time visual feedback while the user holds.
 *
 * @usageNotes
 *
 * ### Context menu on long press
 * ```html
 * <div cngxLongPress (longPressed)="showContextMenu($event)">
 *   Long press me
 * </div>
 * ```
 *
 * ### With visual feedback
 * ```html
 * <div cngxLongPress #lp="cngxLongPress"
 *      [class.holding]="lp.longPressing()">
 *   Hold for action
 * </div>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxLongPress]',
  exportAs: 'cngxLongPress',
  standalone: true,
})
export class CngxLongPress {
  /** Time in ms the pointer must be held to trigger. */
  readonly threshold = input<number>(500);
  /** Whether the directive is active. */
  readonly enabled = input<boolean>(true);
  /** Maximum pointer movement in px before the gesture is cancelled. */
  readonly moveThreshold = input<number>(10);

  /** Emitted when a long-press gesture completes. */
  readonly longPressed = output<PointerEvent>();

  private readonly longPressingState = signal(false);
  /** Whether a long-press gesture is currently building (pointer held, timer running). */
  readonly longPressing = this.longPressingState.asReadonly();

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const doc = inject(DOCUMENT);

    // pointerdown on host, but up/move on document — captures gestures
    // that drift outside the element boundary during the hold.
    const pointerDown$ = fromEvent<PointerEvent>(el, 'pointerdown');
    const pointerUp$ = fromEvent<PointerEvent>(doc, 'pointerup');
    const pointerMove$ = fromEvent<PointerEvent>(doc, 'pointermove');
    const pointerCancel$ = fromEvent<PointerEvent>(el, 'pointercancel');
    const pointerLeave$ = fromEvent<PointerEvent>(el, 'pointerleave');

    pointerDown$
      .pipe(
        filter(() => this.enabled()),
        switchMap((start) => {
          const startX = start.clientX;
          const startY = start.clientY;
          this.longPressingState.set(true);

          // Any of these events cancels the long-press gesture:
          // pointerup (finger lifted), pointercancel (system interrupt),
          // pointerleave (left element), or movement beyond threshold (scroll).
          const cancel$ = merge(
            pointerUp$,
            pointerCancel$,
            pointerLeave$,
            pointerMove$.pipe(
              filter((move) => {
                const dx = move.clientX - startX;
                const dy = move.clientY - startY;
                return Math.hypot(dx, dy) > this.moveThreshold();
              }),
            ),
          ).pipe(tap(() => this.longPressingState.set(false)));

          return timer(this.threshold()).pipe(
            tap(() => {
              this.longPressingState.set(false);
              this.longPressed.emit(start);
            }),
            takeUntil(cancel$),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
