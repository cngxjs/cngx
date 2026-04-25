/**
 * Public API Surface of @cngx/forms/select
 *
 * The whole select family (CngxSelect single, planned CngxMultiSelect,
 * planned CngxCombobox) ships in this one secondary entry. Variants
 * live in sibling folders under `src/lib/`; `src/lib/shared/` hosts
 * reused building blocks (commit controller, option helpers,
 * select-base.css, template slots, config + config features).
 *
 * @module @cngx/forms/select
 */

// ── Variant components ────────────────────────────────────────────────
export {
  CngxSelect,
  type CngxSelectChange,
} from './src/lib/single-select/select.component';
export {
  CngxMultiSelect,
  type CngxMultiSelectChange,
} from './src/lib/multi-select/multi-select.component';
export {
  CngxReorderableMultiSelect,
  type CngxReorderableMultiSelectChange,
} from './src/lib/reorderable-multi-select/reorderable-multi-select.component';
export {
  CNGX_REORDER_COMMIT_HANDLER_FACTORY,
  createReorderCommitHandler,
  type CngxReorderCommitHandlerFactory,
  type ReorderCommitHandler,
  type ReorderCommitHandlerOptions,
} from './src/lib/shared/reorder-commit-handler';
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
} from './src/lib/shared/reorderable-select-config';
export {
  CngxCombobox,
  type CngxComboboxChange,
} from './src/lib/combobox/combobox.component';
export {
  CngxTypeahead,
  type CngxTypeaheadChange,
} from './src/lib/typeahead/typeahead.component';
export {
  CngxActionSelect,
  type CngxActionSelectChange,
} from './src/lib/action-select/action-select.component';
export {
  CngxActionMultiSelect,
  type CngxActionMultiSelectChange,
} from './src/lib/action-multi-select/action-multi-select.component';
export {
  CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  createCreateCommitHandler,
  type CngxCreateCommitHandlerFactory,
  type CreateCommitHandler,
  type CreateCommitHandlerOptions,
} from './src/lib/shared/create-commit-handler';
export {
  type CngxSelectCreateAction,
} from './src/lib/shared/create-action.types';
export { CngxTreeSelectNode } from './src/lib/tree-select/tree-select-node.directive';
export { CngxTreeSelectChip } from './src/lib/tree-select/tree-select-chip.directive';
export { CngxTreeSelectTriggerLabel } from './src/lib/tree-select/tree-select-trigger-label.directive';
export {
  type CngxTreeNode,
  type CngxTreeSelectAction,
  type CngxTreeSelectChipContext,
  type CngxTreeSelectNodeContext,
  type CngxTreeSelectTriggerLabelContext,
  type CngxTreeSelectedItem,
  type FlatTreeNode,
} from './src/lib/tree-select/tree-select.model';
export {
  CngxTreeSelect,
  type CngxTreeSelectChange,
} from './src/lib/tree-select/tree-select.component';

// ── Declarative element components ────────────────────────────────────
// Intended for consumer-assembled listbox templates (the "compose yourself"
// path). NOT usable as direct children of `<cngx-select>` — see
// `.internal/architektur/select-family-architecture.md` for the reasoning.
export { CngxSelectOption } from './src/lib/declarative/option.component';
export { CngxSelectOptgroup } from './src/lib/declarative/optgroup.component';
export { CngxSelectDivider } from './src/lib/declarative/divider.component';

// ── Shared data model (option types + helpers) ────────────────────────
export {
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
  isCngxSelectOptionGroupDef,
  flattenSelectOptions,
  filterSelectOptions,
  mergeLocalItems,
} from './src/lib/shared/option.model';

// ── Local-items buffer (quick-create persistence) ─────────────────────
export {
  CNGX_LOCAL_ITEMS_BUFFER_FACTORY,
  createLocalItemsBuffer,
  type CngxLocalItemsBufferFactory,
  type LocalItemsBuffer,
} from './src/lib/shared/local-items-buffer';

// ── Action-slot config + host bridge ──────────────────────────────────
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
} from './src/lib/shared/action-select-config';
export {
  CNGX_ACTION_HOST_BRIDGE_FACTORY,
  createActionHostBridge,
  type ActionHostBridge,
  type ActionHostBridgeOptions,
  type CngxActionHostBridgeFactory,
} from './src/lib/shared/action-host-bridge';
export {
  type CngxSelectActionCallbacks,
} from './src/lib/shared/panel-host';

// ── Config system ─────────────────────────────────────────────────────
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
} from './src/lib/shared/config';

// ── Commit action types ───────────────────────────────────────────────
export {
  type CngxSelectCommitAction,
  type CngxSelectCommitMode,
  type CngxSelectCommitErrorDisplay,
} from './src/lib/shared/commit-action.types';

// ── Announcer ─────────────────────────────────────────────────────────
export { CngxSelectAnnouncer } from './src/lib/shared/announcer';

// ── Inject helpers ────────────────────────────────────────────────────
export {
  injectSelectConfig,
  injectSelectAnnouncer,
} from './src/lib/shared/inject-helpers';

// ── Template-slot directives ──────────────────────────────────────────
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
  CngxSelectRefreshing,
  CngxSelectCommitError,
  CngxSelectClearButton,
  CngxSelectOptionPending,
  CngxSelectOptionError,
  CngxMultiSelectChip,
  CngxMultiSelectChipHandle,
  CngxMultiSelectTriggerLabel,
  CngxComboboxTriggerLabel,
  CngxSelectInputPrefix,
  CngxSelectInputSuffix,
  CngxSelectAction,
  type CngxSelectCheckContext,
  type CngxSelectCaretContext,
  type CngxSelectOptgroupContext,
  type CngxSelectPlaceholderContext,
  type CngxSelectEmptyContext,
  type CngxSelectLoadingContext,
  type CngxSelectTriggerLabelContext,
  type CngxSelectOptionLabelContext,
  type CngxSelectErrorContext,
  type CngxSelectRefreshingContext,
  type CngxSelectCommitErrorContext,
  type CngxSelectClearButtonContext,
  type CngxSelectOptionPendingContext,
  type CngxSelectOptionErrorContext,
  type CngxMultiSelectChipContext,
  type CngxMultiSelectTriggerLabelContext,
  type CngxComboboxTriggerLabelContext,
  type CngxSelectInputSlotContext,
  type CngxSelectActionContext,
} from './src/lib/shared/template-slots';

// ── Commit-controller DI factory ──────────────────────────────────────
export {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  type CngxSelectCommitControllerFactory,
  type CngxCommitController,
  type CngxCommitBeginHandlers,
  createCommitController,
} from './src/lib/shared/commit-controller';

// ── Field sync factory ────────────────────────────────────────────────
export {
  createFieldSync,
  type FieldSyncOptions,
} from './src/lib/shared/field-sync';

// ── ActiveDescendant activation dispatcher ────────────────────────────
export {
  createADActivationDispatcher,
  type ADActivationDispatcherOptions,
} from './src/lib/shared/ad-activation-dispatcher';

// ── Keyboard typeahead controller + page-jump helper ──────────────────
export {
  createTypeaheadController,
  resolvePageJumpTarget,
  type TypeaheadController,
  type TypeaheadControllerOptions,
} from './src/lib/shared/typeahead-controller';

// ── Display binding (scalar value ↔ input text) ───────────────────────
export {
  CNGX_DISPLAY_BINDING_FACTORY,
  createDisplayBinding,
  type CngxDisplayBindingFactory,
  type DisplayBinding,
  type DisplayBindingOptions,
} from './src/lib/shared/display-binding';

// ── Array commit handler (multi-select / combobox) ────────────────────
export {
  CNGX_ARRAY_COMMIT_HANDLER_FACTORY,
  createArrayCommitHandler,
  type ArrayCommitHandler,
  type ArrayCommitHandlerOptions,
  type CngxArrayCommitHandlerFactory,
} from './src/lib/shared/array-commit-handler';

// ── Scalar commit handler (action-select / planned: single + typeahead) ─
export {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  createScalarCommitHandler,
  type CngxScalarCommitHandlerFactory,
  type ScalarCommitHandler,
  type ScalarCommitHandlerOptions,
} from './src/lib/shared/scalar-commit-handler';

// ── Shared template-slot registry ─────────────────────────────────────
export {
  CNGX_TEMPLATE_REGISTRY_FACTORY,
  createTemplateRegistry,
  type CngxSelectTemplateRegistry,
  type CngxSelectTemplateRegistryQueries,
  type CngxTemplateRegistryFactory,
} from './src/lib/shared/template-registry';

// ── Scalar commit-error announce policy ───────────────────────────────
export {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  createCommitErrorAnnouncer,
  type CngxCommitErrorAnnouncePolicy,
  type CngxCommitErrorAnnounceDeps,
  type CngxCommitErrorAnnouncerOptions,
  type CngxCommitErrorAnnouncerFactory,
} from './src/lib/shared/commit-error-announcer';

// ── Shared trigger focus state ────────────────────────────────────────
export {
  CNGX_TRIGGER_FOCUS_FACTORY,
  createTriggerFocusState,
  type CngxTriggerFocusState,
  type CngxTriggerFocusFactory,
} from './src/lib/shared/trigger-focus';

// ── Shared dismiss handler ────────────────────────────────────────────
export {
  CNGX_DISMISS_HANDLER_FACTORY,
  createDismissHandler,
  type CngxDismissHandlerFactory,
  type DismissHandler,
  type DismissHandlerOptions,
} from './src/lib/shared/dismiss-handler';

// ── Shared panel lifecycle emitter ────────────────────────────────────
export {
  CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY,
  createPanelLifecycleEmitter,
  type CngxPanelLifecycleEmitterFactory,
  type PanelLifecycleEmitterOptions,
} from './src/lib/shared/panel-lifecycle-emitter';

// ── Shared panel renderer (virtualisation extension point) ───────────
export {
  CNGX_PANEL_RENDERER_FACTORY,
  createIdentityPanelRenderer,
  type CngxPanelRendererFactory,
  type PanelRenderer,
  type PanelRendererInput,
} from './src/lib/shared/panel-renderer';
export { createRecyclerPanelRendererFactory } from './src/lib/shared/recycler-panel-renderer';

// ── Shared search-term effects ────────────────────────────────────────
export {
  CNGX_SEARCH_EFFECTS_FACTORY,
  createSearchEffects,
  type CngxSearchEffectsFactory,
  type SearchEffectsOptions,
} from './src/lib/shared/search-effects';

// ── Shared chip-removal handler ───────────────────────────────────────
export {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  createChipRemovalHandler,
  type CngxChipRemovableItem,
  type CngxChipRemovalHandler,
  type CngxChipRemovalHandlerFactory,
  type CngxChipRemovalHandlerOptions,
} from './src/lib/shared/chip-removal-handler';

// ── Shared flat-listbox keyboard-nav strategy ─────────────────────────
export {
  CNGX_FLAT_NAV_STRATEGY,
  createDefaultFlatNavStrategy,
  type CngxFlatNavAction,
  type CngxFlatNavContext,
  type CngxFlatNavStrategy,
} from './src/lib/shared/flat-nav-strategy';
