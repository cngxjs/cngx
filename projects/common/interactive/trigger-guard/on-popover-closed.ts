import { effect, untracked, type OutputRef } from '@angular/core';

/**
 * The popover a trigger drives, as far as a close subscription needs it. The
 * `closed` output is optional, so a controller without it keeps compiling and
 * simply reports no close.
 *
 * @internal
 */
export interface CngxClosablePopover {
  readonly closed?: OutputRef<void>;
}

/**
 * Runs `run` each time the popover reports a close through its `closed`
 * output, whichever path closed it (a key, an outside click, a light
 * dismiss). The wiring effect only subscribes and writes nothing; `run`
 * executes in the subscription callback. The subscription follows the
 * popover reference and ends with the injection context.
 *
 * Call it in an injection context.
 *
 * @internal
 */
export function onPopoverClosed(popover: () => CngxClosablePopover, run: () => void): void {
  effect((onCleanup) => {
    const closed = popover().closed;
    if (!closed) {
      return;
    }
    const subscription = closed.subscribe(() => untracked(run));
    onCleanup(() => subscription.unsubscribe());
  });
}
