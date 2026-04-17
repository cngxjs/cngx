/**
 * Public API Surface of @cngx/forms/select
 * @module @cngx/forms/select
 */
export {
  CngxSelect,
  type CngxSelectChange,
} from './src/select.component';
export {
  type CngxSelectOption,
  type CngxSelectOptionGroup,
  type CngxSelectOptionsInput,
  isCngxSelectOptionGroup,
} from './src/shared/option.model';
export {
  CNGX_SELECT_CONFIG,
  type CngxSelectConfig,
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfigFeature,
  type CngxSelectTemplateContexts,
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
} from './src/shared/config';
export { CngxSelectAnnouncer } from './src/shared/announcer';
export {
  CngxSelectCheck,
  CngxSelectCaret,
  CngxSelectOptgroup,
  CngxSelectPlaceholder,
  CngxSelectEmpty,
  CngxSelectLoading,
  CngxSelectTriggerLabel,
  CngxSelectOptionLabel,
  type CngxSelectCheckContext,
  type CngxSelectCaretContext,
  type CngxSelectOptgroupContext,
  type CngxSelectPlaceholderContext,
  type CngxSelectEmptyContext,
  type CngxSelectLoadingContext,
  type CngxSelectTriggerLabelContext,
  type CngxSelectOptionLabelContext,
} from './src/shared/template-slots';
