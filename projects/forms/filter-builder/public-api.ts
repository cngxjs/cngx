// @cngx/forms/filter-builder public surface.

export {
  DEFAULT_OPERATORS,
  type FilterExpression,
  type FilterFieldDef,
  type FilterGroup,
  type FilterLogic,
  type FilterNode,
  type FilterEditorType,
} from './filter-builder.types';
export {
  CNGX_FILTER_BUILDER_STATE_FACTORY,
  createFilterBuilderState,
  type CngxFilterBuilderState,
  type CngxFilterBuilderStateFactory,
  type CngxFilterBuilderStateOptions,
  type FilterMutationEvent,
  type FilterMutationContext,
  type FilterMutationKind,
} from './filter-builder-state';
export { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
export { CngxFilterGroup } from './filter-builder-group.directive';
export { CngxFilterExpression } from './filter-builder-expression.directive';
export { CngxFilterExpressionRow } from './filter-builder-expression-row.component';
export { CngxFilterRow } from './filter-builder-row.component';
export {
  CNGX_FILTER_BUILDER_CONFIG,
  injectFilterBuilderConfig,
  isNativeEditor,
  provideFilterBuilderConfig,
  provideFilterBuilderConfigAt,
  withDefaultOperators,
  withFilterBuilderI18n,
  withLogicOptions,
  withMaxNestingDepth,
  withNegation,
  withSkeletonCount,
  withTemplates,
  type CngxFilterBuilderAnnouncementFormatters,
  type CngxFilterBuilderConfig,
  type CngxFilterBuilderConfigFeature,
  type CngxFilterBuilderExpressionLabelContext,
  type CngxFilterBuilderGroupLabelContext,
  type CngxFilterBuilderI18n,
  type CngxFilterBuilderTemplates,
  type CngxFilterEditor,
  type CngxFilterNativeEditor,
} from './filter-builder.config';
export { CNGX_FILTER_EDITORS, injectFilterEditors } from './filter-builder.tokens';
export type { CngxFilterEditorComponent } from './filter-builder-editor.contract';
export {
  CngxFilterBuilderValueEditor,
  type CngxFilterBuilderValueEditorContext,
} from './filter-builder-value-editor.slot';
export { CngxFilterBuilderFormFieldControl } from './filter-builder-form-field-control.directive';
export {
  CngxFilterBuilderAddFilterButton,
  CngxFilterBuilderAddGroupButton,
  CngxFilterBuilderEmpty,
  CngxFilterBuilderExpressionTemplate,
  CngxFilterBuilderGroupTemplate,
  CngxFilterBuilderLogicToggle,
  CngxFilterBuilderNegationToggle,
  CngxFilterBuilderRemoveButton,
  type CngxFilterBuilderAddFilterButtonContext,
  type CngxFilterBuilderAddGroupButtonContext,
  type CngxFilterBuilderEmptyContext,
  type CngxFilterBuilderExpressionTemplateContext,
  type CngxFilterBuilderGroupTemplateContext,
  type CngxFilterBuilderLogicToggleContext,
  type CngxFilterBuilderNegationToggleContext,
  type CngxFilterBuilderRemoveButtonContext,
} from './filter-builder-slots';
export {
  CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY,
  createFilterBuilderTemplateRegistry,
  injectFilterBuilderTemplateRegistry,
  type CngxFilterBuilderTemplateRegistry,
  type CngxFilterBuilderTemplateRegistryFactory,
  type CngxFilterBuilderTemplateRegistryQueries,
} from './filter-builder-template-registry';
export {
  CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY,
  createFilterBuilderAnnouncer,
  injectFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncer,
  type CngxFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncerSources,
} from './filter-builder-announcer';
export { CngxFilterBuilder } from './filter-builder.component';
export { CNGX_FILTER_BUILDER_BODY_HOST } from './filter-builder-body.host';
export {
  createEmptyFilterRoot,
  createFilterExpression,
  createFilterGroup,
  ensureFilterTreeIds,
  evaluateExpression,
  toFilterPredicate,
  type CreateFilterGroupOptions,
} from './filter-builder.helpers';
// CngxFilterBuilderHost interface and CNGX_FILTER_BUILDER_HOST token are both
// @internal — they describe the contract between the presenter and the recursive
// context atoms. Consumers reach the host through the presenter directive, never
// through the token directly.
