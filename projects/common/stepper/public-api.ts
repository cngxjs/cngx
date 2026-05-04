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

export { CngxStepperRouterSync } from './src/router-sync.directive';

export {
  CNGX_STEPPER_CONFIG,
  type CngxStepperAriaLabels,
  type CngxStepperConfig,
  type CngxStepperConfigFeature,
  type CngxStepperFallbackLabels,
  injectStepperConfig,
  provideStepperConfig,
  provideStepperConfigAt,
  withDefaultOrientation,
  withStepperAriaLabels,
  withStepperCommitMode,
  withStepperFallbackLabels,
  withStepperLinear,
  withStepperRouterSync,
} from './src/stepper-config';

export {
  CNGX_STEPPER_I18N,
  type CngxStepperI18n,
  injectStepperI18n,
  provideStepperI18n,
} from './src/i18n/stepper-i18n';

export {
  CNGX_STEPPER_COMMIT_HANDLER_FACTORY,
  type CngxStepperCommitHandler,
  type CngxStepperCommitHandlerFactory,
  type CngxStepperCommitHandlerOptions,
  createStepperCommitHandler,
} from './src/commit-handler';
