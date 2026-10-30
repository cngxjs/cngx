import { computed, effect, ElementRef, inject, untracked, type Signal } from '@angular/core';

import { CNGX_HOST_INTERACTION_STATE } from '../async-click/host-interaction-state.token';

/**
 * The panel a trigger opens, as far as the guard needs it.
 *
 * @internal
 */
export interface CngxHostBlockedPanel {
  /** Whether the panel is open right now. */
  readonly isOpen: () => boolean;
  /** Close the panel. */
  close(): void;
}

/**
 * Blocked state of the element a trigger directive sits on.
 *
 * @internal
 */
export interface CngxHostInteractionBlocked {
  /**
   * Reactive part: `true` while a co-hosted component reports `disabled`
   * through {@link CNGX_HOST_INTERACTION_STATE}. Only this part closes an
   * open panel; a host blocked by attribute alone is read at event time.
   */
  readonly blocked: Signal<boolean>;
  /**
   * Event-time check: the reactive part, or a native `disabled` / an
   * `aria-disabled="true"` on the host. Covers hosts that publish no
   * interaction state (a plain `<button>`, a select trigger binding its own
   * `aria-disabled`).
   */
  isBlockedNow(): boolean;
}

/**
 * Guards a trigger directive against a blocked host: the trigger asks
 * {@link CngxHostInteractionBlocked.isBlockedNow} before it opens from the
 * keyboard, and the guard closes `panel` when the host reports `disabled`
 * while it is open. A focusable `aria-disabled` button still receives
 * keydown, so the trigger has to ask.
 *
 * Must run in the injection context of a directive on the host element.
 *
 * @internal
 */
export function injectHostInteractionBlocked(
  panel: CngxHostBlockedPanel,
): CngxHostInteractionBlocked {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const state = inject(CNGX_HOST_INTERACTION_STATE, { self: true, optional: true });
  const blocked = computed(() => state?.disabled() ?? false);
  effect(() => {
    if (blocked() && panel.isOpen()) {
      untracked(() => panel.close());
    }
  });
  return {
    blocked,
    isBlockedNow: () => blocked() || host.matches(':disabled, [aria-disabled="true"]'),
  };
}
