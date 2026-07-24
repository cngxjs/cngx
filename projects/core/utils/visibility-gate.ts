import { DestroyRef, effect, inject, type Signal, signal } from '@angular/core';

/**
 * Creates a debounced visibility signal from an active-state signal.
 *
 * Implements two timing rules:
 * - `delay`: suppresses visibility for fast operations (no flash)
 * - `minDwell`: keeps visible for at least this long once shown (no jarring disappearance)
 *
 * Must be called in an injection context (uses `inject(DestroyRef)` for cleanup).
 *
 * @returns A readonly signal that is `true` when the indicator should be visible.
 * @internal
 */
export function createVisibilityGate(
  isActive: Signal<boolean>,
  delay: Signal<number>,
  minDwell: Signal<number>,
): Signal<boolean> {
  const destroyRef = inject(DestroyRef);
  const visible = signal(false);

  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  let minDwellTimer: ReturnType<typeof setTimeout> | undefined;
  let minDwellElapsed = true;

  effect(() => {
    const active = isActive();
    const delayMs = delay();
    const minMs = minDwell();

    if (active) {
      clearTimer('delay');
      delayTimer = setTimeout(() => {
        delayTimer = undefined;
        visible.set(true);
        minDwellElapsed = false;
        clearTimer('minDwell');
        minDwellTimer = setTimeout(() => {
          minDwellTimer = undefined;
          minDwellElapsed = true;
          if (!isActive()) {
            visible.set(false);
          }
        }, minMs);
      }, delayMs);
    } else {
      clearTimer('delay');
      if (minDwellElapsed) {
        visible.set(false);
      }
    }
  });

  destroyRef.onDestroy(() => {
    clearTimer('delay');
    clearTimer('minDwell');
  });

  function clearTimer(which: 'delay' | 'minDwell'): void {
    if (which === 'delay' && delayTimer !== undefined) {
      clearTimeout(delayTimer);
      delayTimer = undefined;
    }
    if (which === 'minDwell' && minDwellTimer !== undefined) {
      clearTimeout(minDwellTimer);
      minDwellTimer = undefined;
    }
  }

  return visible.asReadonly();
}
