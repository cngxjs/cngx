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
} from './src/presenter.directive';

export {
  CNGX_STEPPER_HOST,
  type CngxStepperHost,
  type CngxStepNode,
  type CngxStepRegistration,
  type CngxStepStatus,
} from './src/stepper-host.token';

export {
  CNGX_STEP_GROUP_HOST,
  type CngxStepGroupHost,
} from './src/step-group-host.token';

export {
  CNGX_STEP_PANEL_HOST,
  type CngxStepPanelHost,
} from './src/step-panel-host.token';

export {
  flattenStepTree,
  stepTreeEqual,
  flatStepsEqual,
  stepNodesEqual,
} from './src/step-tree.util';

export { CngxStep } from './src/step.directive';
export { CngxStepGroup } from './src/step-group.directive';
export { CngxStepLabel } from './src/step-label.directive';
export { CngxStepContent } from './src/step-content.directive';

export {
  CngxStepIndicator,
  type CngxStepIndicatorContext,
} from './src/slots/step-indicator.directive';

export {
  CngxStepBadge,
  type CngxStepBadgeContext,
} from './src/slots/step-badge.directive';

export {
  CngxStepBusySpinner,
  type CngxStepBusySpinnerContext,
} from './src/slots/step-busy-spinner.directive';

export {
  CngxStepRejection,
  type CngxStepRejectionContext,
} from './src/slots/step-rejection.directive';

export {
  CngxStepGroupHeader,
  type CngxStepGroupHeaderContext,
} from './src/slots/step-group-header.directive';

export { CngxStepperEmpty } from './src/slots/stepper-empty.directive';

export {
  createStepperTemplateBindings,
  type CngxStepperTemplateBindings,
  type CngxStepperTemplateBindingsOptions,
} from './src/slots/stepper-template-cascade';

export { CngxStepperRouterSync } from './src/router-sync.directive';

export {
  CNGX_STEPPER_CONFIG,
  type CngxStepperAriaLabels,
  type CngxStepperConfig,
  type CngxStepperConfigFeature,
  type CngxStepperFallbackLabels,
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
  withStepIndicatorTemplate,
  withStepBadgeTemplate,
  withStepBusySpinnerTemplate,
  withStepRejectionTemplate,
  withStepGroupHeaderTemplate,
  withStepperEmptyTemplate,
} from './src/stepper-config';

export {
  CNGX_STEPPER_I18N,
  type CngxStepperI18n,
  type CngxStepperI18nFeature,
  injectStepperI18n,
  provideStepperI18n,
  withStepperI18nLabels,
} from './src/i18n/stepper-i18n';

export {
  CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  type CngxStepperCommitHandler,
  type CngxStepperCommitHandlerFactory,
  type CngxStepperCommitHandlerOptions,
  createStepperCommitHandler,
} from './src/commit-handler';

export {
  provideCngxStepper,
  provideCngxStepperAt,
  type CngxStepperFeature,
} from './src/provide-cngx-stepper';
