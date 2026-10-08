import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The status-pill words of the stepper section.
 *
 * @category common/stepper/i18n
 * @since 0.1.0
 */
export interface CngxStepperStatusLanguage {
  readonly done: string;
  readonly inProgress: string;
  readonly upNext: string;
  readonly errored: string;
}

/**
 * The stepper section of a {@link CngxLanguagePack}: the copy of
 * `@cngx/common/stepper` and of the steppers in `@cngx/ui/stepper` and
 * `@cngx/ui/mat-stepper`. It feeds `CNGX_STEPPER_I18N` and the copy keys of
 * `CNGX_STEPPER_CONFIG` (`ariaLabels`, `fallbackLabels`). Messages use
 * `{name}` placeholders; a plural message picks its form from `{count}`.
 *
 * @category common/stepper/i18n
 * @since 0.1.0
 * @relatedTo CNGX_STEPPER_I18N, CNGX_STEPPER_CONFIG
 */
export interface CngxStepperLanguageSection {
  /** Accessible name of the stepper landmark. */
  readonly stepperRegion: string;
  /** Last-tier landmark label and role description, used when the config keys are unset. */
  readonly stepperLabel: string;
  /** `aria-roledescription` of the stepper organism. */
  readonly stepRoleDescription: string;
  /** Role description of compact step indicators (dot stepper, mobile dots). */
  readonly stepIndicatorRoleDescription: string;
  /** Role description of a step group header. */
  readonly groupRoleDescription: string;
  /** `{label}`, `{position}`, `{count}`: the accessible name of a step. */
  readonly selectedStep: CngxMessage;
  /** `{step}`, `{detail}`: a step name followed by its status or its label. */
  readonly stepWithDetail: CngxMessage;
  /** Plural on `{count}`: the number of steps with errors. */
  readonly stepHasErrors: CngxMessage;
  readonly previousStep: string;
  readonly nextStep: string;
  readonly commitFailedRetry: string;
  /** Announced while a step commit is in flight. */
  readonly commitInFlight: string;
  /** `{origin}`: announced when a failed commit reverts to the origin step. */
  readonly commitRolledBackTo: CngxMessage;
  /** `{base}`: the description of a rolled-back step, `{base}` being its name. */
  readonly stepRolledBack: CngxMessage;
  readonly statusLabels: CngxStepperStatusLanguage;
  /** `{current}`, `{count}`: the short progress caption. */
  readonly textStepperFormat: CngxMessage;
  /** Plural on `{count}`: a collapsed group's step count for screen readers. */
  readonly groupSummaryCount: CngxMessage;
  /** `{completed}`, plural on `{count}`: a collapsed group's progress for screen readers. */
  readonly groupSummaryProgress: CngxMessage;
  /** `{count}`: a collapsed group's visible step count. */
  readonly groupSummaryCountShort: CngxMessage;
  /** `{completed}`, `{count}`: a collapsed group's visible progress. */
  readonly groupSummaryProgressShort: CngxMessage;
  /** `{id}`: the last-resort label of an unlabelled Material step. */
  readonly stepFallbackLabel: CngxMessage;
}

/**
 * The English stepper section: the single source of the stepper's English
 * copy. `CNGX_STEPPER_I18N` and the `CNGX_STEPPER_CONFIG` labels default to it.
 *
 * @category common/stepper/i18n
 * @since 0.1.0
 * @relatedTo CNGX_STEPPER_I18N
 */
export const CNGX_STEPPER_LANGUAGE_EN: CngxStepperLanguageSection = {
  stepperRegion: 'Steps',
  stepperLabel: 'Steps',
  stepRoleDescription: 'stepper',
  stepIndicatorRoleDescription: 'step indicator',
  groupRoleDescription: 'step group',
  selectedStep: 'Step {position} of {count}: {label}',
  stepWithDetail: '{step}: {detail}',
  stepHasErrors: { one: '{count} error', other: '{count} errors' },
  previousStep: 'Previous step',
  nextStep: 'Next step',
  commitFailedRetry: 'Could not save step - retry?',
  commitInFlight: 'Saving step…',
  commitRolledBackTo: 'Reverted to step "{origin}".',
  stepRolledBack: '{base} This step was rolled back.',
  statusLabels: {
    done: 'Done',
    inProgress: 'In progress',
    upNext: 'Up next',
    errored: 'Errored',
  },
  textStepperFormat: 'Step {current} of {count}',
  groupSummaryCount: { one: '{count} step', other: '{count} steps' },
  groupSummaryProgress: {
    one: '{completed} of {count} step complete',
    other: '{completed} of {count} steps complete',
  },
  groupSummaryCountShort: '{count}',
  groupSummaryProgressShort: '{completed}/{count}',
  stepFallbackLabel: 'Step {id}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly stepper: CngxStepperLanguageSection;
  }
}
