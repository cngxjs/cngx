/**
 * Public API Surface of @cngx/forms/select
 * @module @cngx/forms/select
 */
export {
  CngxSelect,
  type CngxSelectChange,
} from './src/select.component';

// ── Data-driven option model ──────────────────────────────────────────
export {
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
  isCngxSelectOptionGroupDef,
  flattenSelectOptions,
} from './src/shared/option.model';

// ── Declarative element components ────────────────────────────────────
// Intended for consumer-assembled listbox templates (the "compose yourself"
// path). NOT usable as direct children of `<cngx-select>` — see
// `.internal/architektur/select-family-architecture.md` for the reasoning.
export { CngxSelectOption } from './src/declarative/option.component';
export { CngxSelectOptgroup } from './src/declarative/optgroup.component';
export { CngxSelectDivider } from './src/declarative/divider.component';

// ── Config system ─────────────────────────────────────────────────────
export {
  CNGX_SELECT_CONFIG,
  type CngxSelectConfig,
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfigFeature,
  type CngxSelectTemplateContexts,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
  provideSelectConfig,
  provideSelectConfigAt,
  withPanelWidth,
  withPanelClass,
  withTypeaheadDebounce,
  withTypeaheadWhileClosed,
  withSelectionIndicator,
  withCaret,
  withRestoreFocus,
  withDismissOn,
  withOpenOn,
  withAnnouncer,
  withLoadingVariant,
  withSkeletonRowCount,
  withRefreshingVariant,
  withCommitErrorDisplay,
} from './src/shared/config';

// ── Commit action types ───────────────────────────────────────────────
export {
  type CngxSelectCommitAction,
  type CngxSelectCommitMode,
  type CngxSelectCommitErrorDisplay,
} from './src/shared/commit-action.types';

// ── Announcer ─────────────────────────────────────────────────────────
export { CngxSelectAnnouncer } from './src/shared/announcer';

// ── Inject helpers ────────────────────────────────────────────────────
export {
  injectSelectConfig,
  injectSelectAnnouncer,
} from './src/shared/inject-helpers';

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
} from './src/shared/template-slots';
