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
  CngxCombobox,
  type CngxComboboxChange,
} from './src/lib/combobox/combobox.component';
export {
  CngxTypeahead,
  type CngxTypeaheadChange,
} from './src/lib/typeahead/typeahead.component';

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
} from './src/lib/shared/option.model';

// ── Config system ─────────────────────────────────────────────────────
export {
  CNGX_SELECT_CONFIG,
  type CngxSelectConfig,
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfigFeature,
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
  withLoadingVariant,
  withSkeletonRowCount,
  withRefreshingVariant,
  withCommitErrorDisplay,
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
  CngxMultiSelectTriggerLabel,
  CngxComboboxTriggerLabel,
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
  createDisplayBinding,
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
