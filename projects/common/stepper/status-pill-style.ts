import type { CngxStepperI18n } from './i18n/stepper-i18n';

/**
 * Pre-quoted CSS string values for the four status-pill labels surfaced
 * by the `stripe-status-rich` skin. Each value carries literal CSS
 * quotes so the consuming `::after` rules can read them via
 * `content: var(...)` without per-rule string wrapping. Pure data -
 * the i18n bundle itself is not reactive, so the texts are computed
 * once at construction.
 *
 * @category common/stepper
 */
export interface CngxStepperStatusPillCssTexts {
  readonly upcoming: string;
  readonly inProgress: string;
  readonly done: string;
  readonly errored: string;
}

/**
 * Build the pre-quoted status-pill text bundle from a resolved
 * {@link CngxStepperI18n}. Pure factory - no injection context
 * required, no signal graph involvement.
 *
 * @category common/stepper
 */
export function createStepperStatusPillCssTexts(
  i18n: CngxStepperI18n,
): CngxStepperStatusPillCssTexts {
  return {
    upcoming: `"${i18n.statusLabels.upNext}"`,
    inProgress: `"${i18n.statusLabels.inProgress}"`,
    done: `"${i18n.statusLabels.done}"`,
    errored: `"${i18n.statusLabels.errored}"`,
  };
}
