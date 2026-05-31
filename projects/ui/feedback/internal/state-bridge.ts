import { effect, untracked } from '@angular/core';
import { type AsyncStatus, createTransitionTracker } from '@cngx/core/utils';

/**
 * Shared transition plumbing for the alert/toast/banner state bridges.
 *
 * Owns the `createTransitionTracker` + guarded `effect` + `untracked` body —
 * the three directives supply the status source and the per-transition body.
 * Keeping `createTransitionTracker` as the single tracker source preserves
 * its `linkedSignal` equal-fn loop fix (the documented vitest-hang guard);
 * the inner `untracked()` keeps the body off the reactive graph so option
 * reads inside it don't re-fire the bridge.
 *
 * Constructor-only: installs an `effect`, so callers must invoke from an
 * injection context.
 *
 * @internal — not exported from `public-api.ts`; consumed by the bridge
 *   directives via relative path.
 */
export function createStateBridge(
  statusSource: () => AsyncStatus,
  onTransition: (status: AsyncStatus, previous: AsyncStatus) => void,
): void {
  const tracker = createTransitionTracker(statusSource);

  effect(() => {
    const status = tracker.current();
    const previous = tracker.previous();

    if (status === previous) {
      return;
    }

    untracked(() => onTransition(status, previous));
  });
}
