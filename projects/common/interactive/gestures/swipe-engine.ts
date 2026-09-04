import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, map, merge, switchMap, takeUntil, tap } from 'rxjs';

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
 * Owns the full hardening set so both directives stay in parity: pointer
 * capture on the host, a `pointercancel` arm, per-gesture `pointerId`
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

        // Capture the pointer on the host so subsequent move / up events
        // route here even when the cursor leaves the original element
        // (real mouse drags drift off the panel into the page chrome).
        try {
          el.setPointerCapture(pointerId);
        } catch {
          // setPointerCapture throws if pointerId is invalid (e.g.
          // synthetic event in some test envs) - safe to ignore.
        }
        const release = (): void => {
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
          tap((move) => hooks.onMove(move.clientX - startX, move.clientY - startY)),
          takeUntil(
            settle$.pipe(
              tap((settle) => {
                release();
                hooks.onSettle(settle);
              }),
            ),
          ),
        );
      }),
      takeUntilDestroyed(),
    )
    .subscribe();
}
