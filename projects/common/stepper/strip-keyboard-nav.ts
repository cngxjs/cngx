import { afterNextRender, type Injector } from '@angular/core';

import type { CngxStepperHost } from './stepper-host.token';

/**
 * Options for {@link createStepperStripKeyboardNav}.
 *
 * @internal
 */
export interface CngxStepperStripKeyboardNavOptions {
  /** Host contract that owns the active-step state and selection methods. */
  readonly presenter: CngxStepperHost;
  /** Host element used to locate the active step button after the move. */
  readonly hostElement: HTMLElement;
  /** Returns the current flat-step count so `End` lands on the last step. */
  readonly flatStepCount: () => number;
  /**
   * Maps a CngxStepNode id to its DOM button id (e.g. `${id}-header`).
   * The strip selects by stable DOM id rather than waiting for the
   * `aria-current` attribute to flip - the id binding does not depend
   * on the active-step signal, so the lookup is correct the same tick
   * the presenter's `activeStepId` updates.
   */
  readonly stepButtonIdFor: (stepId: string) => string;
  /**
   * Optional class name guard - the handler only runs when
   * `event.target.classList.contains(stepClassName)`. Defaults to the
   * canonical strip button class so panel-content key presses pass
   * through untouched.
   */
  readonly stepClassName?: string;
  /**
   * Optional gate - when supplied and returning `false`, the handler is
   * a complete no-op. Used to switch arrow-key navigation off in the
   * `headerNavigation: 'none'` mode, where the step headers are inert
   * labels rather than focusable buttons. Omitted defaults to enabled.
   */
  readonly enabled?: () => boolean;
  /**
   * Injector used to defer the post-move focus to `afterNextRender`.
   * Required when the strip can re-render its node set on navigation
   * (focus-driven group collapse: crossing a group boundary removes the
   * old button and adds the target's), so the focus lands after the new
   * DOM exists. Omitted, focus falls back to a `queueMicrotask` defer -
   * correct for a static strip where every button is always present.
   */
  readonly injector?: Injector;
}

/**
 * Builds the WAI-ARIA APG arrow-key handler for a stepper strip. The
 * composed `CngxRovingTabindex` cannot reach view-template step buttons
 * (its `contentChildren` query only sees projected content), so the
 * organism wires this factory's return value to its host `(keydown)`
 * binding to honour the documented keyboard contract.
 *
 * Horizontal orientation: ArrowLeft / ArrowRight navigate. Vertical:
 * ArrowUp / ArrowDown. Home / End jump to the first / last flat step
 * regardless of orientation. The presenter's `select*` methods enforce
 * linear-mode gating so callers do not duplicate that check here.
 *
 * @internal
 */
export function createStepperStripKeyboardNav(
  options: CngxStepperStripKeyboardNavOptions,
): (event: KeyboardEvent) => void {
  const stepClass = options.stepClassName ?? 'cngx-stepper__step';
  const scheduleFocus = (focus: () => void): void => {
    // After the next render when an injector is supplied (the strip may
    // re-render its node set on a group-boundary crossing); a microtask
    // otherwise. Either way the focus runs after the active-step signal
    // has settled, so the target button exists.
    if (options.injector) {
      afterNextRender(focus, { injector: options.injector });
    } else {
      queueMicrotask(focus);
    }
  };
  const focusActive = (): void => {
    const activeId = options.presenter.activeStepId();
    if (!activeId) {
      return;
    }
    const buttonId = options.stepButtonIdFor(activeId);
    scheduleFocus(() => {
      const el = options.hostElement.querySelector(`[id="${buttonId}"]`);
      if (el instanceof HTMLElement) {
        el.focus();
      }
    });
  };
  return (event: KeyboardEvent): void => {
    if (options.enabled && !options.enabled()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.classList.contains(stepClass)) {
      return;
    }
    const isHorizontal = options.presenter.orientation() === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    if (event.key === nextKey) {
      event.preventDefault();
      options.presenter.selectNext();
      focusActive();
    } else if (event.key === prevKey) {
      event.preventDefault();
      options.presenter.selectPrevious();
      focusActive();
    } else if (event.key === 'Home') {
      event.preventDefault();
      options.presenter.select(0);
      focusActive();
    } else if (event.key === 'End') {
      event.preventDefault();
      options.presenter.select(options.flatStepCount() - 1);
      focusActive();
    }
  };
}
