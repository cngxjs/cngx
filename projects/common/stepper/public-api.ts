/**
 * @module @cngx/common/stepper
 *
 * Level-2 directive-only logic for stepper / wizard flows. Ships the
 * presenter brain, atom directives, host tokens, router-sync, config
 * cascade, and i18n. Zero `@Component`, zero `.html`, zero `.css` -
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
  CngxStepError,
  type CngxStepErrorContext,
} from './slots/step-error.directive';

export {
  CngxStepGroupHeader,
  type CngxStepGroupHeaderContext,
} from './slots/step-group-header.directive';

export { CngxStepperEmpty } from './slots/stepper-empty.directive';

export {
  CngxDotStepperDot,
  type CngxDotStepperDotContext,
} from './slots/dot-stepper-dot.directive';

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
  type CngxStepperDensity,
  type CngxStepperDensityBreakpoints,
  type CngxStepperFallbackLabels,
  type CngxStepperGroupCollapse,
  type CngxStepperHeaderNavigation,
  type CngxStepperMobileCollapse,
  type CngxStepperMobileIndicatorPosition,
  type CngxStepperSkin,
  type CngxStepperTemplates,
  injectStepperConfig,
  provideStepperConfig,
  provideStepperConfigAt,
  STEPPER_DEFAULT_DENSITY_BREAKPOINTS,
  STEPPER_DEFAULT_MOBILE_BREAKPOINT,
  withStepperDefaultOrientation,
  withStepperDensity,
  withStepperAriaLabels,
  withStepperCommitMode,
  withStepperConnectors,
  withStepperFallbackLabels,
  withStepperGroupCollapse,
  withStepperHeaderNavigation,
  withStepperLinear,
  withStepperMobileBreakpoint,
  withStepperMobileCollapse,
  withStepperMobileIndicatorPosition,
  withStepperMobileSwipe,
  withStepperRouterSync,
  withStepperSkin,
  withStepIndicatorTemplate,
  withStepBadgeTemplate,
  withStepBusySpinnerTemplate,
  withStepRejectionTemplate,
  withStepErrorTemplate,
  withStepGroupHeaderTemplate,
  withStepperEmptyTemplate,
  withDotStepperDotTemplate,
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

export { resolveStepperStatusLabel } from './status-label';

export {
  createMobileViewportSignal,
  createStepperDisplayMode,
} from './mobile-viewport';

export {
  createStripDensity,
  type CngxStripDensity,
  type CngxStripDensityOptions,
} from './strip-density';

// The following three blocks ship `@internal` factory helpers. They are
// exported through `public-api.ts` so the sibling `@cngx/ui/stepper`
// organism can consume them across the secondary-entry boundary
// (ng-packagr has no cross-entry private surface). `disableInternal: true`
// in `.compodocrc.json` hides them from generated docs; the LLM-md export
// honours the same tag. Precedent: `CNGX_STEPPER_GLYPHS`, `flatStepsEqual`.
export {
  createStepperHostAttrs,
  type CngxStepperHostAttrs,
  type CngxStepperHostAttrsInputs,
} from './stepper-host-attrs';

export {
  createStepperStripKeyboardNav,
  type CngxStepperStripKeyboardNavOptions,
} from './strip-keyboard-nav';

export {
  createStepperStateView,
  resolveStepperErrorSummary,
  type CngxStepperStateView,
} from './stepper-state-view';

export {
  createStepperSlotContextBuilders,
  type CngxStepperSlotContextBuilders,
  type CngxStepperSlotContextBuildersInputs,
} from './slot-context-builders';

export {
  createStepperAnnouncementBuilders,
  type CngxStepperAnnouncementBuilders,
  type CngxStepperAnnouncementBuildersInputs,
} from './announcement-builders';

export { CngxStepperSwipeNav } from './swipe-nav.directive';

export { CngxStepperCount, type CngxStepperCountHost } from './stepper-count';

export { CngxStepperPrevious } from './controls/stepper-previous.directive';
export { CngxStepperNext } from './controls/stepper-next.directive';
export { CngxStepperComplete } from './controls/stepper-complete.directive';
export { createStepperHostProxy } from './create-stepper-host-proxy';


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
