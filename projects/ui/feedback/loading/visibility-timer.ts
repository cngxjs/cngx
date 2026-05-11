import { DestroyRef, effect, inject, type Signal, signal } from '@angular/core';

/**
 * Creates a debounced visibility signal from an active-state signal.
 *
 * Implements two timing rules:
 * - `delay`: suppresses visibility for fast operations (no flash)
 * - `minDuration`: keeps visible for at least this long once shown (no jarring disappearance)
 *
 * Must be called in an injection context (uses `inject(DestroyRef)` for cleanup).
 *
 * @returns A readonly signal that is `true` when the indicator should be visible.
 */
export function createVisibilityTimer(
  isActive: Signal<boolean>,
  delay: Signal<number>,
  minDuration: Signal<number>,
): Signal<boolean> {
  const destroyRef = inject(DestroyRef);
  const visible = signal(false);

  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  let minDurationTimer: ReturnType<typeof setTimeout> | undefined;
  let minDurationElapsed = true;

  effect(() => {
    const active = isActive();
    const delayMs = delay();
    const minMs = minDuration();

    if (active) {
      clearTimer('delay');
      delayTimer = setTimeout(() => {
        delayTimer = undefined;
        visible.set(true);
        minDurationElapsed = false;
        clearTimer('minDuration');
        minDurationTimer = setTimeout(() => {
          minDurationTimer = undefined;
          minDurationElapsed = true;
          if (!isActive()) {
            visible.set(false);
          }
        }, minMs);
      }, delayMs);
    } else {
      clearTimer('delay');
      if (minDurationElapsed) {
        visible.set(false);
      }
    }
  });

  destroyRef.onDestroy(() => {
    clearTimer('delay');
    clearTimer('minDuration');
  });

  function clearTimer(which: 'delay' | 'minDuration'): void {
    if (which === 'delay' && delayTimer !== undefined) {
      clearTimeout(delayTimer);
      delayTimer = undefined;
    }
    if (which === 'minDuration' && minDurationTimer !== undefined) {
      clearTimeout(minDurationTimer);
      minDurationTimer = undefined;
    }
  }

  return visible.asReadonly();
}
