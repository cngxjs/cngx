/**
 * Public API Surface of @cngx/forms/select
 *
 * The whole select family (CngxSelect single, planned CngxMultiSelect,
 * planned CngxCombobox) ships in this one secondary entry. Variants
 * live in sibling folders under this secondary entry; `shared/` hosts
 * reused building blocks (commit controller, option helpers,
 * select-base.css, template slots, config + config features).
 *
 * @module @cngx/forms/select
 */

export { CngxSelect, type CngxSelectChange } from './single-select/select.component';
export { CngxMultiSelect, type CngxMultiSelectChange } from './multi-select/multi-select.component';
export {
  CngxReorderableMultiSelect,
  type CngxReorderableMultiSelectChange,
} from './reorderable-multi-select/reorderable-multi-select.component';
export {
  CNGX_REORDER_COMMIT_HANDLER_FACTORY,
  createReorderCommitHandler,
  type CngxReorderCommitHandlerFactory,
  type ReorderCommitHandler,
  type ReorderCommitHandlerOptions,
} from './shared/reorder-commit-handler';
export {
  CNGX_REORDERABLE_SELECT_CONFIG,
  provideReorderableSelectConfig,
  provideReorderableSelectConfigAt,
  withDefaultDragHandle,
  withReorderAriaLabel,
  withReorderKeyboardModifier,
  withReorderStripFreeze,
  type CngxReorderableSelectConfig,
  type CngxReorderableSelectConfigFeature,
} from './shared/reorderable-select-config';
export { CngxCombobox, type CngxComboboxChange } from './combobox/combobox.component';
export { CngxTypeahead, type CngxTypeaheadChange } from './typeahead/typeahead.component';
export {
  CngxActionSelect,
  type CngxActionSelectChange,
} from './action-select/action-select.component';
export {
  CngxActionMultiSelect,
  type CngxActionMultiSelectChange,
} from './action-multi-select/action-multi-select.component';
export {
  CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  createCreateCommitHandler,
  type CngxCreateCommitHandlerFactory,
  type CreateCommitHandler,
  type CreateCommitHandlerOptions,
} from './shared/create-commit-handler';
export { type CngxSelectCreateAction } from './shared/create-action.types';
export { CngxTreeSelectNode } from './tree-select/tree-select-node.directive';
export { CngxTreeSelectChip } from './tree-select/tree-select-chip.directive';
export { CngxTreeSelectTriggerLabel } from './tree-select/tree-select-trigger-label.directive';
export {
  type CngxTreeNode,
  type CngxTreeSelectAction,
  type CngxTreeSelectChipContext,
  type CngxTreeSelectNodeContext,
  type CngxTreeSelectTriggerLabelContext,
  type CngxTreeSelectedItem,
  type FlatTreeNode,
} from './tree-select/tree-select.model';
export { CngxTreeSelect, type CngxTreeSelectChange } from './tree-select/tree-select.component';
export { CngxSelectShell, type CngxSelectShellChange } from './select-shell/select-shell.component';

// Consumer-assembled listbox templates + projection children of <cngx-select-shell>.
// NOT valid as direct children of the data-mode <cngx-select>.
export { CngxSelectOption } from './declarative/option.component';
export { CngxSelectOptgroup } from './declarative/optgroup.component';
export { CngxSelectDivider } from './declarative/divider.component';
export { CngxSelectSearch } from './declarative/select-search.component';
export {
  CNGX_SELECT_SHELL_SEARCH_HOST,
  type CngxSelectShellSearchHost,
} from './declarative/select-search-host';

export {
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
  isCngxSelectOptionGroupDef,
  flattenSelectOptions,
  filterSelectOptions,
  mergeLocalItems,
} from './shared/option.model';

export {
  CNGX_LOCAL_ITEMS_BUFFER_FACTORY,
  createLocalItemsBuffer,
  type CngxLocalItemsBufferFactory,
  type LocalItemsBuffer,
} from './shared/local-items-buffer';

export {
  CNGX_ACTION_SELECT_CONFIG,
  provideActionSelectConfig,
  provideActionSelectConfigAt,
  resolveActionSelectConfig,
  withActionAriaLabel,
  withActionPopoverPlacement,
  withActionPosition,
  withCloseOnCreate,
  withFocusTrapBehavior,
  withLiveInputFallback,
  type CngxActionFocusTrapBehavior,
  type CngxActionPosition,
  type CngxActionSelectConfig,
  type CngxActionSelectConfigFeature,
} from './shared/action-select-config';
export {
  CNGX_ACTION_HOST_BRIDGE_FACTORY,
  createActionHostBridge,
  type ActionHostBridge,
  type ActionHostBridgeOptions,
  type CngxActionHostBridgeFactory,
} from './shared/action-host-bridge';
export { type CngxSelectActionCallbacks } from './shared/panel-host';

export {
  CNGX_SELECT_CONFIG,
  type CngxSelectConfig,
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
  type CngxSelectConfigFeature,
  type CngxSelectFallbackLabels,
  type CngxSelectTemplateContexts,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
  type CngxSelectSelectionIndicatorPosition,
  type CngxSelectSelectionIndicatorVariant,
  provideSelectConfig,
  provideSelectConfigAt,
  withPanelWidth,
  withPanelClass,
  withTypeaheadDebounce,
  withTypeaheadWhileClosed,
  withSelectionIndicator,
  withSelectionIndicatorPosition,
  withSelectionIndicatorVariant,
  withCaret,
  withRestoreFocus,
  withDismissOn,
  withOpenOn,
  withAnnouncer,
  withAriaLabels,
  withLoadingVariant,
  withSkeletonRowCount,
  withRefreshingVariant,
  withCommitErrorDisplay,
  withCommitErrorAnnouncePolicy,
  withChipOverflow,
  withEnterKeyHint,
  withFallbackLabels,
  withInputMode,
  withMaxVisibleChips,
  withPopoverPlacement,
  withVirtualization,
  type CngxSelectVirtualizationConfig,
} from './shared/config';

export {
  type CngxSelectCommitAction,
  type CngxSelectCommitMode,
  type CngxSelectCommitErrorDisplay,
} from './shared/commit-action.types';

export { CngxSelectAnnouncer } from './shared/announcer';

export { injectSelectConfig, injectSelectAnnouncer } from './shared/inject-helpers';

export {
  CngxSelectCheck,
  CngxSelectCaret,
  CngxSelectOptgroupTemplate,
  CngxSelectPlaceholder,
  CngxSelectEmpty,
  CngxSelectLoading,
  CngxSelectTriggerLabel,
  CngxSelectOptionLabel,
  CngxSelectError,
  CngxSelectRetryButton,
  CngxSelectLoadingGlyph,
  CngxSelectRefreshing,
  CngxSelectCommitError,
  CngxSelectClearButton,
  CngxSelectOptionPending,
  CngxSelectOptionError,
  CngxMultiSelectChip,
  CngxMultiSelectChipHandle,
  CngxMultiSelectTriggerLabel,
  CngxComboboxChip,
  CngxComboboxTriggerLabel,
  CngxSelectInputPrefix,
  CngxSelectInputSuffix,
  CngxSelectAction,
  type CngxSelectCheckContext,
  type CngxSelectCheckBoxContext,
  type CngxSelectCheckRadioContext,
  type CngxSelectCaretContext,
  type CngxSelectOptgroupContext,
  type CngxSelectPlaceholderContext,
  type CngxSelectEmptyContext,
  type CngxSelectLoadingContext,
  type CngxSelectTriggerLabelContext,
  type CngxSelectOptionLabelContext,
  type CngxSelectErrorContext,
  type CngxSelectRetryButtonContext,
  type CngxSelectRefreshingContext,
  type CngxSelectCommitErrorContext,
  type CngxSelectClearButtonContext,
  type CngxSelectOptionPendingContext,
  type CngxSelectOptionErrorContext,
  type CngxMultiSelectChipContext,
  type CngxMultiSelectTriggerLabelContext,
  type CngxComboboxChipContext,
  type CngxComboboxTriggerLabelContext,
  type CngxSelectInputSlotContext,
  type CngxSelectActionContext,
} from './shared/template-slots';

export {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  type CngxSelectCommitControllerFactory,
  type CngxCommitController,
  type CngxCommitBeginHandlers,
  createCommitController,
} from './shared/commit-controller.token';

export { createFieldSync, type FieldSyncOptions } from './shared/field-sync';

export {
  createADActivationDispatcher,
  type ADActivationDispatcherOptions,
} from './shared/ad-activation-dispatcher';

export {
  createTypeaheadController,
  resolvePageJumpTarget,
  type TypeaheadController,
  type TypeaheadControllerOptions,
} from './shared/typeahead-controller';

export {
  CNGX_DISPLAY_BINDING_FACTORY,
  createDisplayBinding,
  type CngxDisplayBindingFactory,
  type DisplayBinding,
  type DisplayBindingOptions,
} from './shared/display-binding';

export {
  CNGX_ARRAY_COMMIT_HANDLER_FACTORY,
  createArrayCommitHandler,
  type ArrayCommitHandler,
  type ArrayCommitHandlerOptions,
  type CngxArrayCommitHandlerFactory,
} from './shared/array-commit-handler';

export {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  createScalarCommitHandler,
  type CngxScalarCommitHandlerFactory,
  type ScalarCommitHandler,
  type ScalarCommitHandlerOptions,
} from './shared/scalar-commit-handler';

export {
  CNGX_TEMPLATE_REGISTRY_FACTORY,
  createTemplateRegistry,
  type CngxSelectTemplateRegistry,
  type CngxSelectTemplateRegistryQueries,
  type CngxTemplateRegistryFactory,
} from './shared/template-registry';

export {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  createCommitErrorAnnouncer,
  type CngxCommitErrorAnnouncePolicy,
  type CngxCommitErrorAnnounceDeps,
  type CngxCommitErrorAnnouncerOptions,
  type CngxCommitErrorAnnouncerFactory,
} from './shared/commit-error-announcer';

export {
  CNGX_TRIGGER_FOCUS_FACTORY,
  createTriggerFocusState,
  type CngxTriggerFocusState,
  type CngxTriggerFocusFactory,
} from './shared/trigger-focus';

export {
  CNGX_DISMISS_HANDLER_FACTORY,
  createDismissHandler,
  type CngxDismissHandlerFactory,
  type DismissHandler,
  type DismissHandlerOptions,
} from './shared/dismiss-handler';

export {
  CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY,
  createPanelLifecycleEmitter,
  type CngxPanelLifecycleEmitterFactory,
  type PanelLifecycleEmitterOptions,
} from './shared/panel-lifecycle-emitter';

export {
  CNGX_PANEL_RENDERER_FACTORY,
  createIdentityPanelRenderer,
  type CngxPanelRendererFactory,
  type PanelRenderer,
  type PanelRendererInput,
} from './shared/panel-renderer';
export { createRecyclerPanelRendererFactory } from './shared/recycler-panel-renderer';

export {
  CNGX_SEARCH_EFFECTS_FACTORY,
  createSearchEffects,
  type CngxSearchEffectsFactory,
  type SearchEffectsOptions,
} from './shared/search-effects';

export {
  CNGX_PROJECTED_OPTION_MODEL_FACTORY,
  createProjectedOptionModel,
  type CngxProjectedOptionModelFactory,
  type ProjectedOptionModel,
  type ProjectedOptionModelInput,
} from './shared/projected-option-model';

export {
  provideCngxSelect,
  provideCngxSelectAt,
  type CngxSelectAggregatorFeature,
} from './shared/provide-cngx-select';

export {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  createChipRemovalHandler,
  type CngxChipRemovableItem,
  type CngxChipRemovalHandler,
  type CngxChipRemovalHandlerFactory,
  type CngxChipRemovalHandlerOptions,
} from './shared/chip-removal-handler';

export {
  CNGX_FLAT_NAV_STRATEGY,
  createDefaultFlatNavStrategy,
  type CngxFlatNavAction,
  type CngxFlatNavContext,
  type CngxFlatNavStrategy,
} from './shared/flat-nav-strategy';
