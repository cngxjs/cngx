import { type DestroyRef, type Signal, signal } from '@angular/core';

/** The user-gesture events that satisfy the browser autoplay policy. */
const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

/**
 * A minimal `EventTarget` surface — only what the gate installs. Accepting
 * this narrow shape (rather than a concrete `Document`) keeps the factory
 * inject-free and trivially fakeable in a spec.
 */
export type GestureEventTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

/** Public handle returned by {@link createAutoplayGate}. */
export interface CngxAutoplayGate {
  /**
   * `true` once a user gesture (or an explicit {@link arm}) has satisfied the
   * browser autoplay policy. Derived from a single gesture event — never
   * synced from multiple handlers.
   */
  readonly armed: Signal<boolean>;

  /** Arm the gate programmatically (e.g. after an existing trusted gesture). */
  arm(): void;
}

/**
 * Create the autoplay gate: a one-shot latch that flips `armed` to `true` on
 * the first `pointerdown` / `keydown` / `touchstart` and then removes its own
 * listeners. The engine consults `armed()` before resuming the shared
 * `AudioContext`, honouring the browser autoplay policy without a permission
 * prompt.
 *
 * Pure factory — takes its `target` and `destroyRef` as arguments rather than
 * calling `inject()`, so it composes inside the engine's injection context yet
 * stays testable with a fake target. No DI token: the gate has no independent
 * swap consumer (severity ladder `concern: over-abstraction`), so it ships
 * token-less and the engine owns it.
 *
 * @param deps.target The event target to listen on (typically the `Document`).
 * @param deps.destroyRef Cleanup owner — removes any surviving listeners on destroy.
 */
export function createAutoplayGate(deps: {
  readonly target: GestureEventTarget;
  readonly destroyRef: Pick<DestroyRef, 'onDestroy'>;
}): CngxAutoplayGate {
  const { target, destroyRef } = deps;
  const armed = signal(false);

  function removeListeners(): void {
    for (const type of GESTURE_EVENTS) {
      target.removeEventListener(type, handleGesture);
    }
  }

  function arm(): void {
    if (armed()) {
      return;
    }
    armed.set(true);
    removeListeners();
  }

  function handleGesture(): void {
    arm();
  }

  for (const type of GESTURE_EVENTS) {
    target.addEventListener(type, handleGesture, { passive: true });
  }
  destroyRef.onDestroy(removeListeners);

  return {
    armed: armed.asReadonly(),
    arm,
  };
}
