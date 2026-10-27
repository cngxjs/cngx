import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, fromEvent, map, merge, switchMap, takeUntil, tap } from 'rxjs';

/**
 * Movement in px a pointer may travel before the engine treats the gesture
 * as a swipe and captures the pointer. Matches the tap tolerance of
 * `CngxLongPress` (`moveThreshold` default) so both gestures agree on where
 * a tap ends.
 *
 * @internal
 */
export const SWIPE_CAPTURE_SLOP_PX = 10;

/** Raw pointer deltas of a settled gesture. @internal */
export interface SwipeSettle {
  readonly dx: number;
  readonly dy: number;
}

/** @internal */
export interface SwipeEngineHooks {
  readonly enabled: () => boolean;
  /** Called on every move of the captured pointer with the raw deltas. */
  readonly onMove: (dx: number, dy: number) => void;
  /** Called when the gesture settles. `null` = pointercancel (browser reclaimed the pointer). */
  readonly onSettle: (settle: SwipeSettle | null) => void;
}

/**
 * Shared pointer-gesture engine behind `CngxSwipe` and `CngxSwipeDismiss`.
 *
 * Owns the full hardening set so both directives stay in parity: lazy
 * pointer capture on the host, a `pointercancel` arm, per-gesture `pointerId`
 * filtering on the document-level streams, and `takeUntilDestroyed`
 * teardown. Must be called in an injection context.
 *
 * @internal
 */
export function createSwipeEngine(el: HTMLElement, doc: Document, hooks: SwipeEngineHooks): void {
  const pointerDown$ = fromEvent<PointerEvent>(el, 'pointerdown');
  const pointerMove$ = fromEvent<PointerEvent>(doc, 'pointermove');
  const pointerUp$ = fromEvent<PointerEvent>(doc, 'pointerup');
  // pointercancel fires when the browser takes the pointer back (system
  // gesture, popup, JS-triggered focus loss). Without an explicit arm the
  // in-flight state would stay stuck because pointerup never arrives.
  const pointerCancel$ = fromEvent<PointerEvent>(doc, 'pointercancel');

  pointerDown$
    .pipe(
      filter(() => hooks.enabled()),
      switchMap((start) => {
        const startX = start.clientX;
        const startY = start.clientY;
        const pointerId = start.pointerId;
        // Document streams see every pointer; a second finger or a stylus
        // hovering mid-gesture must not steer this gesture's deltas.
        const samePointer = (e: PointerEvent) => e.pointerId === pointerId;

        // Capture lazily: only once the pointer leaves the tap slop. Capturing
        // on pointerdown retargets the follow-up `click` to the host, which
        // kills every interactive child (close / done buttons in a sheet
        // header). Past the slop it is a swipe, and capture keeps the
        // pointerup coming even when it is released outside the window.
        let captured = false;
        const captureOnSlop = (dx: number, dy: number): void => {
          if (captured || Math.hypot(dx, dy) <= SWIPE_CAPTURE_SLOP_PX) {
            return;
          }
          captured = true;
          try {
            el.setPointerCapture(pointerId);
          } catch {
            // setPointerCapture throws if pointerId is invalid (e.g.
            // synthetic event in some test envs) - safe to ignore.
          }
        };
        const release = (): void => {
          if (!captured) {
            return;
          }
          captured = false;
          try {
            el.releasePointerCapture(pointerId);
          } catch {
            // releasePointerCapture throws when the pointer is no longer
            // captured (e.g. the browser already released it before firing
            // pointercancel) - safe to ignore.
          }
        };

        const settle$ = merge(
          pointerUp$.pipe(
            filter(samePointer),
            map((end): SwipeSettle | null => ({
              dx: end.clientX - startX,
              dy: end.clientY - startY,
            })),
          ),
          pointerCancel$.pipe(
            filter(samePointer),
            map(() => null),
          ),
        );

        return pointerMove$.pipe(
          filter(samePointer),
          tap((move) => {
            const dx = move.clientX - startX;
            const dy = move.clientY - startY;
            captureOnSlop(dx, dy);
            hooks.onMove(dx, dy);
          }),
          takeUntil(
            settle$.pipe(
              tap((settle) => {
                release();
                hooks.onSettle(settle);
              }),
            ),
          ),
          // A new pointerdown (switchMap) or host destroy mid-drag must not
          // strand the capture on the host.
          finalize(release),
        );
      }),
      takeUntilDestroyed(),
    )
    .subscribe();
}
