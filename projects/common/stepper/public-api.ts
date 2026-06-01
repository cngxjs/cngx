/**
 * @module @cngx/common/stepper
 *
 * Level-2 directive-only logic for stepper / wizard flows. Ships the
 * presenter brain, atom directives, host tokens, router-sync, config
 * cascade, and i18n. Zero `@Component`, zero `.html`, zero `.css` —
 * those live in `@cngx/ui/stepper` (CNGX-standard skin) and
 * `@cngx/ui/mat-stepper` (Material twin).
 */

export {
  CngxStepperPresenter,
  type CngxStepperCommitAction,
} from './presenter.directive';

export {
  CNGX_STEPPER_HOST,
  type CngxStepperHost,
  type CngxStepNode,
  type CngxStepRegistration,
  type CngxStepStatus,
} from './stepper-host.token';

export {
  CNGX_STEP_GROUP_HOST,
  type CngxStepGroupHost,
} from './step-group-host.token';

export {
  CNGX_STEP_PANEL_HOST,
  type CngxStepContentContext,
  type CngxStepLabelContext,
  type CngxStepPanelHost,
} from './step-panel-host.token';

export { flatStepsEqual } from './step-tree.util';

export { CngxStep } from './step.directive';
export { CngxStepGroup } from './step-group.directive';
export { CngxStepLabel } from './step-label.directive';
export { CngxStepContent } from './step-content.directive';

export {
  CngxStepIndicator,
  type CngxStepIndicatorContext,
} from './slots/step-indicator.directive';

export {
  CngxStepBadge,
  type CngxStepBadgeContext,
} from './slots/step-badge.directive';

export {
  CngxStepBusySpinner,
  type CngxStepBusySpinnerContext,
} from './slots/step-busy-spinner.directive';

export {
  CngxStepRejection,
  type CngxStepRejectionContext,
} from './slots/step-rejection.directive';

export {
  CngxStepGroupHeader,
  type CngxStepGroupHeaderContext,
} from './slots/step-group-header.directive';

export { CngxStepperEmpty } from './slots/stepper-empty.directive';

export {
  createStepperTemplateBindings,
  type CngxStepperTemplateBindings,
  type CngxStepperTemplateBindingsOptions,
} from './slots/stepper-template-cascade';

export { CNGX_STEPPER_GLYPHS } from './glyphs';

export { CngxStepperRouterSync } from './router-sync.directive';

export {
  CNGX_STEPPER_CONFIG,
  type CngxStepperAriaLabels,
  type CngxStepperConfig,
  type CngxStepperConfigFeature,
  type CngxStepperFallbackLabels,
  type CngxStepperSkin,
  type CngxStepperTemplates,
  injectStepperConfig,
  provideStepperConfig,
  provideStepperConfigAt,
  withStepperDefaultOrientation,
  withStepperAriaLabels,
  withStepperCommitMode,
  withStepperFallbackLabels,
  withStepperLinear,
  withStepperRouterSync,
  withStepperSkin,
  withStepIndicatorTemplate,
  withStepBadgeTemplate,
  withStepBusySpinnerTemplate,
  withStepRejectionTemplate,
  withStepGroupHeaderTemplate,
  withStepperEmptyTemplate,
} from './stepper-config';

export {
  CNGX_STEPPER_I18N,
  type CngxStepperI18n,
  type CngxStepperI18nFeature,
  type CngxStepperI18nOverrides,
  type CngxStepperStatusLabels,
  injectStepperI18n,
  provideStepperI18n,
  withStepperI18nLabels,
} from './i18n/stepper-i18n';

export {
  type CngxStepperStatusPillCssTexts,
  createStepperStatusPillCssTexts,
} from './status-pill-style';

export {
  CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  type CngxStepperCommitHandler,
  type CngxStepperCommitHandlerFactory,
  type CngxStepperCommitHandlerOptions,
  createStepperCommitHandler,
} from './commit-handler';

export {
  provideCngxStepper,
  provideCngxStepperAt,
  type CngxStepperFeature,
} from './provide-cngx-stepper';
