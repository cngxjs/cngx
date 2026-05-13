// @cngx/forms/filter-builder public surface — populated phase-by-phase per
// .internal/architektur/plans/filter-builder-plan.md.

export {
  createFilterBuilderState,
  type CngxFilterBuilderState,
  type CngxFilterBuilderStateOptions,
  type FilterMutationEvent,
  type FilterMutationContext,
  type FilterMutationKind,
} from './src/filter-builder-state';
export { CngxFilterBuilderPresenter } from './src/filter-builder-presenter.directive';
export { CngxFilterGroup } from './src/filter-builder-group.directive';
export { CngxFilterExpression } from './src/filter-builder-expression.directive';
// CngxFilterBuilderHost interface and CNGX_FILTER_BUILDER_HOST token are both
// @internal — they describe the contract between the presenter and the recursive
// context atoms. Consumers reach the host through the presenter directive, never
// through the token directly.
