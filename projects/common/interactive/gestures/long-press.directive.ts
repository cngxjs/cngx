import { DOCUMENT } from '@angular/common';
import { computed, Directive, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { fromEvent, filter, switchMap, takeUntil, timer, tap, merge } from 'rxjs';

/**
 * Detects long-press gestures via Pointer Events.
 *
 * Fires `longPressed` after the primary button is held down for the `threshold`
 * duration without moving more than 10px. Cancels on pointer move (prevents
 * accidental triggers during scrolling), pointer up, pointer cancel, pointer
 * leave, and `enabled` turning `false`. Other buttons never start a press.
 *
 * The pointer `click` that follows the release of a completed long press is
 * cancelled in the capture phase on the host, so a host or child `(click)`
 * does not run on top of the long-press action. A short tap clicks as usual,
 * and a keyboard or programmatic click is never cancelled.
 *
 * Exposes `longPressing` signal for real-time visual feedback while the user holds.
 * A long press has no keyboard equivalent: give the action a second path
 * (a button, a menu entry, or a key binding).
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/gestures/long-press.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSwipeDismiss, CngxPressable
 * <example-url>/#/common/interactive/gestures/long-press/custom-threshold</example-url>
 * <example-url>/#/common/interactive/gestures/long-press/long-press-with-visual-feedback</example-url>
 * @axis level atom
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
  readonly longPressing = computed(() => this.enabled() && this.longPressingState());

  /** Set when a long press completes; the next click on the host is cancelled. */
  private suppressClick = false;

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const doc = inject(DOCUMENT);

    // A keyboard or programmatic click (detail 0) is never swallowed: when the
    // pointer click of the press landed elsewhere the guard stays armed until
    // the next interaction, and must not eat an Enter / Space activation.
    fromEvent<MouseEvent>(el, 'click', { capture: true })
      .pipe(
        filter((click) => this.suppressClick && click.detail !== 0),
        takeUntilDestroyed(),
      )
      .subscribe((click) => {
        this.suppressClick = false;
        click.preventDefault();
        click.stopImmediatePropagation();
      });

    // up/move on document so the gesture survives drifting outside the host.
    const pointerDown$ = fromEvent<PointerEvent>(el, 'pointerdown');
    const pointerUp$ = fromEvent<PointerEvent>(doc, 'pointerup');
    const pointerMove$ = fromEvent<PointerEvent>(doc, 'pointermove');
    const pointerCancel$ = fromEvent<PointerEvent>(el, 'pointercancel');
    const pointerLeave$ = fromEvent<PointerEvent>(el, 'pointerleave');
    const disabled$ = toObservable(this.enabled).pipe(filter((enabled) => !enabled));

    // Any pointerdown or keydown anywhere ends the guard, captured on the
    // document so a descendant that stops propagation cannot keep it armed
    // (mirrors the drawer surface's trailing-click release).
    merge(
      fromEvent(doc, 'pointerdown', { capture: true }),
      fromEvent(doc, 'keydown', { capture: true }),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => (this.suppressClick = false));

    pointerDown$
      .pipe(
        filter((down) => down.button === 0 && this.enabled()),
        switchMap((start) => {
          const startX = start.clientX;
          const startY = start.clientY;
          this.longPressingState.set(true);

          const cancel$ = merge(
            pointerUp$,
            pointerCancel$,
            pointerLeave$,
            disabled$,
            pointerMove$.pipe(
              filter((move) => {
                const dx = move.clientX - startX;
                const dy = move.clientY - startY;
                return Math.hypot(dx, dy) > this.moveThreshold();
              }),
            ),
          ).pipe(tap(() => this.longPressingState.set(false)));

          return timer(this.threshold()).pipe(
            tap(() => this.longPressingState.set(false)),
            filter(() => this.enabled()),
            tap(() => {
              this.suppressClick = true;
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
