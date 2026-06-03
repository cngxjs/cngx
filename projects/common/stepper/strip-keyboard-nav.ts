import type { CngxStepperHost } from './stepper-host.token';

/**
 * Options for {@link createStepperStripKeyboardNav}.
 *
 * @category common/stepper
 * @docsKind internal
 * @since 0.1.0
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
 * @category common/stepper
 * @docsKind internal
 * @since 0.1.0
 */
export function createStepperStripKeyboardNav(
  options: CngxStepperStripKeyboardNavOptions,
): (event: KeyboardEvent) => void {
  const stepClass = options.stepClassName ?? 'cngx-stepper__step';
  const focusActive = (): void => {
    const activeId = options.presenter.activeStepId();
    if (!activeId) {
      return;
    }
    const buttonId = options.stepButtonIdFor(activeId);
    queueMicrotask(() => {
      const el = options.hostElement.querySelector(`[id="${buttonId}"]`);
      if (el instanceof HTMLElement) {
        el.focus();
      }
    });
  };
  return (event: KeyboardEvent): void => {
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
