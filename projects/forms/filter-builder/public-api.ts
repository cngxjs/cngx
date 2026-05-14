// @cngx/forms/filter-builder public surface — populated phase-by-phase per
// .internal/architektur/plans/filter-builder-plan.md.

export {
  CNGX_FILTER_BUILDER_STATE_FACTORY,
  createFilterBuilderState,
  type CngxFilterBuilderState,
  type CngxFilterBuilderStateFactory,
  type CngxFilterBuilderStateOptions,
  type FilterMutationEvent,
  type FilterMutationContext,
  type FilterMutationKind,
} from './src/filter-builder-state';
export { CngxFilterBuilderPresenter } from './src/filter-builder-presenter.directive';
export { CngxFilterGroup } from './src/filter-builder-group.directive';
export { CngxFilterExpression } from './src/filter-builder-expression.directive';
export {
  CNGX_FILTER_BUILDER_CONFIG,
  injectFilterBuilderConfig,
  isNativeEditor,
  provideFilterBuilderConfig,
  provideFilterBuilderConfigAt,
  withDefaultOperators,
  withEditors,
  withFilterBuilderI18n,
  withLogicOptions,
  withMaxNestingDepth,
  withNegation,
  withTemplates,
  type CngxFilterBuilderAnnouncementFormatters,
  type CngxFilterBuilderConfig,
  type CngxFilterBuilderConfigFeature,
  type CngxFilterBuilderI18n,
  type CngxFilterBuilderTemplates,
  type CngxFilterEditor,
  type CngxFilterNativeEditor,
} from './src/filter-builder.config';
export { CNGX_FILTER_EDITORS, injectFilterEditors } from './src/filter-builder.tokens';
export {
  CngxFilterBuilderAddFilterButton,
  CngxFilterBuilderAddGroupButton,
  CngxFilterBuilderEmpty,
  CngxFilterBuilderError,
  CngxFilterBuilderExpressionTemplate,
  CngxFilterBuilderGroupTemplate,
  CngxFilterBuilderLoading,
  CngxFilterBuilderLogicToggle,
  CngxFilterBuilderRemoveButton,
  type CngxFilterBuilderAddFilterButtonContext,
  type CngxFilterBuilderAddGroupButtonContext,
  type CngxFilterBuilderEmptyContext,
  type CngxFilterBuilderErrorContext,
  type CngxFilterBuilderExpressionTemplateContext,
  type CngxFilterBuilderGroupTemplateContext,
  type CngxFilterBuilderLoadingContext,
  type CngxFilterBuilderLogicToggleContext,
  type CngxFilterBuilderRemoveButtonContext,
} from './src/filter-builder-slots';
export {
  CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY,
  createFilterBuilderTemplateRegistry,
  injectFilterBuilderTemplateRegistry,
  type CngxFilterBuilderTemplateRegistry,
  type CngxFilterBuilderTemplateRegistryFactory,
  type CngxFilterBuilderTemplateRegistryQueries,
} from './src/filter-builder-template-registry';
export {
  CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY,
  createFilterBuilderAnnouncer,
  injectFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncer,
  type CngxFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncerSources,
} from './src/filter-builder-announcer';
export { CngxFilterBuilder } from './src/filter-builder.component';
export {
  createEmptyFilterRoot,
  createFilterExpression,
  createFilterGroup,
  evaluateExpression,
  toFilterPredicate,
  type CreateFilterGroupOptions,
} from './src/filter-builder.helpers';
// CngxFilterBuilderHost interface and CNGX_FILTER_BUILDER_HOST token are both
// @internal — they describe the contract between the presenter and the recursive
// context atoms. Consumers reach the host through the presenter directive, never
// through the token directly.
