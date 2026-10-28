import { computed, ElementRef, inject, type Signal } from '@angular/core';

import { CNGX_HOST_INTERACTION_STATE } from './host-interaction-state.token';

/**
 * Blocked state of the element a trigger directive sits on.
 *
 * @internal
 */
export interface CngxHostInteractionBlocked {
  /**
   * Reactive part: `true` while a co-hosted component reports `disabled`
   * through {@link CNGX_HOST_INTERACTION_STATE}. Drives effects such as
   * closing an open panel when its trigger becomes blocked.
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
 * Reads whether the host element currently refuses interaction, for
 * trigger directives that open a panel from the keyboard. A focusable
 * `aria-disabled` button still receives keydown, so the trigger has to ask.
 *
 * Must run in the injection context of a directive on the host element.
 *
 * @internal
 */
export function injectHostInteractionBlocked(): CngxHostInteractionBlocked {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const state = inject(CNGX_HOST_INTERACTION_STATE, { self: true, optional: true });
  const blocked = computed(() => state?.disabled() ?? false);
  return {
    blocked,
    isBlockedNow: () => blocked() || host.matches(':disabled, [aria-disabled="true"]'),
  };
}
