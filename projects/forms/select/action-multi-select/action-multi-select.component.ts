import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import {
  CNGX_NESTED_INTERACTIVE_SELECTOR,
  CNGX_STATEFUL,
  injectLocale,
  nextUid,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';

import { CngxChip, CngxIconSvg } from '@cngx/common/display';
import { CNGX_ICON_CARET_DOWN, CNGX_ICON_X } from '@cngx/utils';
import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxSearch,
  CngxListboxTrigger,
} from '@cngx/common/interactive';
import {
  CngxPopover,
  CngxPopoverAnchor,
  CngxPopoverSheet,
  CngxPopoverSheetInitialFocus,
  CngxPopoverTrigger,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationRequest,
  type PopoverPlacement,
} from '@cngx/common/popover';

import { injectSelectCopy } from '../i18n/select-i18n';
import { CngxSelectPanel } from '../shared/internal/panel/panel.component';
import { CngxSelectPanelShell } from '../shared/internal/panel-shell/panel-shell.component';
import { toListboxMatchFn } from '../shared/internal/listbox-match';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFieldSkinHost,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import {
  CNGX_ARRAY_COMMIT_HANDLER_FACTORY,
  type ArrayCommitHandler,
} from '../shared/array-commit-handler';
import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_SELECT_SHEET_SCOPE,
  CngxScopedSelectAnnouncer,
} from '../shared/internal/scoped-announcer';
import {
  createSelectSheetWiring,
  type CngxSelectSheetWiring,
} from '../shared/internal/select-sheet-wiring';
import { CngxSelectSheetHeader } from '../shared/internal/sheet-header/sheet-header.component';
import { CngxSelectSheetTrigger } from '../shared/internal/sheet-trigger.directive';
import { CNGX_SELECT_SHEET_HEADER_HOST } from '../shared/sheet-header-host';
import { type CngxCommitErrorAnnouncePolicy } from '../shared/commit-error-announcer';
import {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
import { CngxSelectSummary } from '../shared/internal/summary/select-summary.component';
import { createSelectSummary } from '../shared/internal/summary/select-summary';
import {
  CngxSelectChipFitSlot,
  CngxSelectChipFitStrip,
  injectChipFitFocusHandOff,
} from '../shared/internal/chip-fit-strip.directive';
import { injectTouchFloorSignal } from '../shared/internal/touch-floor';
import { sameArrayContents } from '../shared/internal/compare';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitErrorDisplay,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectMatchFn,
  type CngxSelectRefreshingVariant,
  type CngxSelectSelectionIndicatorVariant,
} from '../shared/config';
import { CNGX_SELECT_COMMIT_CONTROLLER_FACTORY } from '../shared/commit-controller.token';
import {
  CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  type CreateCommitHandler,
} from '../shared/create-commit-handler';
import type { CngxSelectCreateAction } from '../shared/create-action.types';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from '../shared/panel-host';
import { resolveActionSelectConfig } from '../shared/action-select-config';
import { mergeCommitState } from '../shared/internal/merged-commit-state';
import { CNGX_FLAT_NAV_STRATEGY } from '../shared/flat-nav-strategy';
import { createActionTriggerInput } from '../shared/internal/action-trigger-input';
import { resolveSearchMatch, resolveSelectConfig } from '../shared/internal/resolve-config';
import { createArrayToggleDispatch } from '../shared/internal/array-toggle';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import { CNGX_SEARCH_EFFECTS_FACTORY, searchResultsFrom } from '../shared/search-effects';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
  type CngxSelectCore,
} from '../shared/internal/select-core';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import { createHostFocusWithin } from '../shared/internal/host-focus-within';
import { createInputHostHandlers } from '../shared/internal/input-host-handlers';
import {
  CngxComboboxTriggerLabel,
  type CngxComboboxTriggerLabelContext,
  CngxMultiSelectChip,
  type CngxMultiSelectChipContext,
  CngxSelectChipOverflow,
  type CngxSelectChipOverflowContext,
  CngxSelectAction,
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectRetryButton,
  CngxSelectInputPrefix,
  CngxSelectInputSuffix,
  CngxSelectLoading,
  CngxSelectLoadingGlyph,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectSheetHandle,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectRefreshing,
  type CngxSelectInputSlotContext,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxActionMultiSelect.selectionChange}.
 * `action` mirrors the flat multi family plus `'create'` - `added`
 * carries exactly the one new value and `removed` is empty, so delta-
 * aggregating consumers treat create identically to toggle-add.
 */
export interface CngxActionMultiSelectChange<T = unknown> {
  readonly source: CngxActionMultiSelect<T>;
  readonly values: readonly T[];
  readonly previousValues?: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear' | 'create';
}

/**
 * Multi-value combobox with inline quick-create. Parallels
 * {@link CngxCombobox} and adds the action-slot protocol from
 * `CngxActionSelect`: `*cngxSelectAction.commit()` routes through the
 * {@link CreateCommitHandler} to materialise a new `T`, patches the
 * local buffer, appends to `values`, emits
 * `selectionChange({ action: 'create', added: [newValue] })`.
 *
 * `closeOnCreate` default `false` - multi-pick UX keeps the panel open
 * after each create. Commit-controller supersede guard tears down
 * previous subscriptions on rapid consecutive creates.
 *
 * Dismiss-guard: Escape and click-outside intercepted while
 * `actionDirty()` is `true`; Escape fires `cancel()`.
 *
 * Slot tiers: `cngxSelectCheck`, `cngxSelectCaret`, `cngxSelectOptgroup`,
 * `cngxSelectEmpty`, `cngxSelectLoading`, `cngxSelectOptionLabel`,
 * `cngxSelectError`, `cngxSelectRetryButton`, `cngxSelectRefreshing`,
 * `cngxSelectCommitError`, `cngxSelectClearButton`,
 * `cngxSelectOptionPending`, `cngxSelectOptionError` and `cngxSelectAction`
 * also take an app-wide default through `CNGX_SELECT_CONFIG.templates`
 * (`withTemplates`); `cngxComboboxTriggerLabel`, `cngxMultiSelectChip`,
 * `cngxSelectChipOverflow`, `cngxSelectInputPrefix` and
 * `cngxSelectInputSuffix` are directive-only.
 * `cngxSelectLoadingGlyph` resolves from the projected directive first and
 * `templates.loadingGlyph` second. The `placeholder` input is the input's
 * own placeholder text; there is no placeholder slot.
 *
 * **Mobile sheet.** On a coarse screen narrower than 48rem the panel opens as
 * a modal fullscreen panel with the search input in its header: a
 * `role="dialog"` named by the field label, with a close button, Done and a
 * decorative handle (`*cngxSelectSheetHandle`). Focus moves into the sheet on
 * open and back to the trigger on close, the rest of the page is inert, and
 * announcements are spoken from inside the sheet. `[presentation]` forces
 * `'anchored'`, `'sheet'` or `'fullscreen'`; `withMobileSheet('off')` keeps
 * every select in its scope anchored.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/action-multi-select/action-multi-select.component.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxActionSelect, CngxCombobox, CngxSelectAction
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>/#/forms/select/action-multi-select/basic</example-url>
 * <example-url>/#/forms/select/mobile-sheet/all-variants</example-url>
 * @slot cngxSelectCheck Replaces the checkbox indicator on each option row unless hideSelectionIndicator is set; gets option, selected, variant, position, and indeterminate (always false here, absent under the radio variant).
 * @slot cngxSelectCaret Replaces the trigger caret unless hideCaret is set; gets open.
 * @slot cngxSelectOptgroup Replaces the header of each option group in the panel; gets group.
 * @slot cngxSelectEmpty Replaces the panel's empty message when no option exists or none matches the typed term; gets searchTerm, filtered.
 * @slot cngxSelectLoading Replaces the panel's loading indicator during the first load of [state], or while [loading] is true without [state]; gets retry.
 * @slot cngxSelectLoadingGlyph Replaces the inner glyph of the spinner or bar loading view and of the refresh indicator when no cngxSelectLoading / cngxSelectRefreshing template is set; no context.
 * @slot cngxComboboxTriggerLabel Replaces the chip strip and the touch summary whenever projected, including with no selection, while the search input stays; gets selected, values, count.
 * @slot cngxSelectOptionLabel Replaces the label content of each option row; gets option, selected, highlighted.
 * @slot cngxSelectError Replaces the panel's error block on a failed load and the inline error above the options on a failed refresh; gets error, retry.
 * @slot cngxSelectRetryButton Replaces the retry button inside the built-in load-error, inline-error and commit-error blocks; gets retry, error, disabled, label.
 * @slot cngxSelectRefreshing Replaces the refresh indicator shown above the options while a reload runs; previousCount is always 0 on this host.
 * @slot cngxSelectCommitError Replaces the panel's commit-error banner when a commit fails and commitErrorDisplay is 'banner'; gets error, option, retry.
 * @slot cngxMultiSelectChip Replaces each chip in the trigger strip unless cngxComboboxTriggerLabel is projected; gets option, remove. Fine pointer only.
 * @slot cngxSelectChipOverflow Replaces the +N badge after the visible chips when chipOverflow is 'truncate' and selected options are hidden, and the badge of the touch summary; gets count, label, hidden. The chip-strip badge is fine pointer only.
 * @slot cngxSelectClearButton Replaces the clear-all button, shown when clearable is set, a value is selected and the control is enabled and not readonly; gets clear, disabled.
 * @slot cngxSelectOptionPending Replaces the spinner on an option row while its commit is in flight; gets option.
 * @slot cngxSelectOptionError Replaces the error mark on selected rows when a commit fails and commitErrorDisplay is 'inline'; gets option, error.
 * @slot cngxSelectInputPrefix Renders before the search input; gets disabled, focused, panelOpen.
 * @slot cngxSelectInputSuffix Renders after the search input, before the clear button and caret; gets disabled, focused, panelOpen.
 * @slot cngxSelectAction Renders the inline create workflow in the panel at actionPosition ('top', 'bottom' or 'both', hidden on 'none'); gets searchTerm, commit, close, isPending, dirty, setDirty, error, hasError, retry, value.
 * @slot cngxSelectSheetHandle Replaces the decorative drag handle of the mobile sheet, inside an aria-hidden wrapper; gets $implicit/presentation, dragging.
 * @axis level organism
 */
@Component({
  selector: 'cngx-action-multi-select',
  exportAs: 'cngxActionMultiSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxIconSvg,
    CngxPopoverSheet,
    CngxPopoverSheetInitialFocus,
    CngxSelectSheetHeader,
    CngxSelectSheetTrigger,
    CngxChip,
    CngxClickOutside,
    CngxListbox,
    CngxListboxSearch,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverAnchor,
    CngxPopoverTrigger,
    CngxSelectPanel,
    CngxSelectPanelShell,
    CngxSelectChipFitSlot,
    CngxSelectChipFitStrip,
    CngxSelectSummary,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CngxSelectAnnouncer, useClass: CngxScopedSelectAnnouncer },
    {
      provide: CNGX_SELECT_SHEET_SCOPE,
      useFactory: () => inject(CngxActionMultiSelect).sheetWiring,
    },
    {
      provide: CNGX_SELECT_SHEET_HEADER_HOST,
      useFactory: () => inject(CngxActionMultiSelect).sheetWiring.headerHost,
    },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxActionMultiSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxActionMultiSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useFactory: () => inject(CngxActionMultiSelect).panelHost },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useFactory: () => inject(CngxActionMultiSelect).panelHost },
  ],
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    class: 'cngx-action-multi-select',
    '(focusin)': 'hostFocus.handleFocusIn()',
    '(focusout)': 'hostFocus.handleFocusOut($event)',
    '(mousedown)': 'hostFocus.handleMouseDown($event)',
  },
  templateUrl: './action-multi-select.component.html',
  styleUrls: ['../shared/select-base.css', './action-multi-select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxActionMultiSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();
  private readonly actionConfig = resolveActionSelectConfig();

  /**
   * Field label. Names the trigger when neither `aria-label` nor
   * `aria-labelledby` is set, names the listbox, and stands in for an empty
   * `placeholder`.
   */
  readonly label = input<string>('');
  /**
   * Options in data-driven mode, flat or grouped. Ignored while `state` is
   * bound; its data wins.
   */
  readonly options = input<CngxSelectOptionsInput<T>>([] as CngxSelectOptionsInput<T>);
  /**
   * Placeholder rendered inside the input when nothing is selected; falls back
   * to `label` when unset.
   */
  readonly placeholder = input<string>('');
  /**
   * Disables the trigger and the panel. Merges with the disabled state of an
   * enclosing `cngx-form-field`.
   */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
  /**
   * Marks the control as required and sets `aria-required`. Merges with the
   * required state of an enclosing `cngx-form-field`.
   */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });
  /** Equality function that matches values to options. Defaults to `Object.is`. */
  readonly compareWith = input<CngxSelectCompareFn<T>>(
    cngxSelectDefaultCompare as CngxSelectCompareFn<T>,
  );
  /** Host id. Unset, it takes the input id of an enclosing `cngx-form-field`. */
  readonly idInput = input<string | null>(null, { alias: 'id' });
  /**
   * Accessible name of the trigger. Wins over `label`, and inside a
   * `cngx-form-field` over the field label too; only a consumer
   * `aria-labelledby` outranks it.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /**
   * Id of the element that names the trigger. Unset, it takes the label id of
   * an enclosing `cngx-form-field`.
   */
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });
  /** Tab index of the trigger. Defaults to `0`; a disabled control always uses `-1`. */
  readonly tabIndex = input<number>(0);
  /** Focuses the trigger once after the first render. */
  readonly autofocus = input<boolean>(false);
  /** Classes on the panel root, merged with `CngxSelectConfig.panelClass`. */
  readonly panelClass = input<string | readonly string[] | null>(null);
  /**
   * Panel min-width: `'trigger'` matches the trigger width, a number sets
   * pixels, `null` sizes to content. Defaults to `CngxSelectConfig.panelWidth`.
   */
  readonly panelWidth = input<'trigger' | number | null>(this.config.panelWidth);
  /**
   * Per-instance match policy. Receives the option's `{ value, label }` and the
   * term and returns `true` when the option should stay visible. Wins over
   * `CngxSelectConfig.searchMatchFn`; the default is the folded label match in
   * the reading locale.
   */
  readonly searchMatchFn = input<CngxSelectMatchFn<T> | null>(null);
  /**
   * Debounce in ms between a keystroke and the search filter update and
   * `searchTermChange`. Wins over `CngxSelectConfig.searchDebounceMs`
   * (default 300). `0` updates on every keystroke.
   */
  readonly searchDebounceMs = input<number>(this.config.searchDebounceMs);
  /** Suppresses the first `searchTermChange` emission, the empty term written on hydration. */
  readonly skipInitial = input<boolean>(false);
  /**
   * Hides the per-option selection indicator. Defaults to the inverse of
   * `CngxSelectConfig.showSelectionIndicator`.
   */
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  /**
   * Places the selection indicator before or after the option label. `null`
   * inherits `CngxSelectConfig.selectionIndicatorPosition`.
   */
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  /**
   * Visual form of the selection indicator: checkmark, checkbox, radio or
   * `'auto'`. `null` inherits `CngxSelectConfig.selectionIndicatorVariant`.
   */
  readonly selectionIndicatorVariant = input<CngxSelectSelectionIndicatorVariant | null>(null);
  /** Hides the trigger caret. Defaults to the inverse of `CngxSelectConfig.showCaret`. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  /**
   * Replaces the built-in clear glyph inside the default clear button while
   * keeping the button frame, ARIA and click handler. Ignored when
   * `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /** Replaces the built-in caret glyph. Ignored when `*cngxSelectCaret` is projected. */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  /** Renders a clear button while the selection is not empty and the control is enabled and not readonly. */
  readonly clearable = input<boolean>(false);
  /** @internal The select section at this reading site; per-variant defaults. */
  private readonly selectCopy = injectSelectCopy();
  /**
   * Accessible name of the clear button. Unset, it reads
   * `CngxSelectConfig.ariaLabels.clearButton`, then the select copy of the
   * active language.
   */
  readonly clearButtonAriaLabel = input<string | undefined>(undefined);
  protected readonly caretIcon = CNGX_ICON_CARET_DOWN;
  protected readonly clearIcon = CNGX_ICON_X;
  /** @internal Bound value, else the config copy; follows a language switch. */
  protected readonly resolvedClearButtonAriaLabel = computed<string>(
    () =>
      this.clearButtonAriaLabel() ??
      this.config.ariaLabels().clearButton ??
      this.selectCopy().resetSelection,
  );
  /**
   * Accessible name of the remove button on each chip, combined with the chip
   * label. Unset, it reads `CngxSelectConfig.ariaLabels.chipRemove`.
   */
  readonly chipRemoveAriaLabel = input<string | undefined>(undefined);
  /** @internal Bound value, else the config copy; follows a language switch. */
  protected readonly resolvedChipRemoveAriaLabel = computed<string>(
    () => this.chipRemoveAriaLabel() ?? this.config.ariaLabels().chipRemove,
  );
  /**
   * @internal Accessible name of a chip's remove button: the remove action and
   * the chip label placed by the `chipRemoveFor` message.
   */
  protected readonly chipRemoveLabelFor = computed<(label: string) => string>(() => {
    const action = this.resolvedChipRemoveAriaLabel();
    const format = this.config.ariaLabels().chipRemoveFor;
    return (label) => format(action, label);
  });
  /** Shows the first-load indicator in the panel while no `state` is bound. */
  readonly loading = input<boolean>(false);
  /**
   * First-load indicator: skeleton, spinner, bar or text. A projected
   * `*cngxSelectLoading` wins; defaults to `CngxSelectConfig.loadingVariant`.
   */
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  /**
   * Number of skeleton rows while `loadingVariant` is `'skeleton'`. Defaults to
   * `CngxSelectConfig.skeletonRowCount`.
   */
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  /**
   * Indicator over the visible options during a reload: bar, spinner, dots or
   * none. A projected `*cngxSelectRefreshing` wins; defaults to
   * `CngxSelectConfig.refreshingVariant`.
   */
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);
  /**
   * Async-state source for the options. When bound, its data replaces `options`
   * and its status drives the loading, empty, error and refreshing views.
   */
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);
  /** Callback the built-in retry button runs after a failed load, before `retry` emits. */
  readonly retryFn = input<(() => void) | null>(null);
  /**
   * Async write handler run on every toggle, clear and chip removal with the
   * intended values. Unset, the change applies directly; `commitMode` decides
   * how it shows while the handler runs. Creates run through
   * `quickCreateAction` instead.
   */
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);
  /**
   * Value write while `commitAction` runs. `'optimistic'` (default) applies the
   * change at once and rolls it back on error; `'pessimistic'` holds it behind
   * a row spinner until the commit succeeds. The panel stays open in both
   * modes.
   */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  /**
   * Panel presentation. Unset follows `CNGX_SELECT_CONFIG.mobileSheet`:
   * `'auto'` opens a modal bottom sheet on coarse, narrow viewports and
   * stays anchored elsewhere. `'anchored'`, `'sheet'` and `'fullscreen'`
   * force one presentation.
   */
  readonly presentation = input<CngxPopoverPresentationRequest | undefined>(undefined);
  /**
   * Title of the mobile sheet. Unset reads the field label once per open,
   * then `[label]`, then `ariaLabels.fieldLabelFallback`.
   */
  readonly sheetLabel = input<string | undefined>(undefined);
  /**
   * Built-in surface for a failed commit when no `*cngxSelectCommitError` is
   * projected: banner, inline or none. Defaults to
   * `CngxSelectConfig.commitErrorDisplay`.
   */
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(this.config.commitErrorDisplay);
  /**
   * Turns live-region announcements of selection changes on or off. `null`
   * inherits `CngxSelectConfig.announcer.enabled`, which defaults to on.
   */
  readonly announceChanges = input<boolean | null>(null);
  /**
   * Formatter for the live-region announcement of a selection change. `null`
   * inherits `CngxSelectConfig.announcer.format`.
   */
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);
  /**
   * Commit-error announce policy. `'verbose'` reads the error message into the
   * live region; `'soft'` announces a generic removal at the current selection
   * count. Per-instance input wins over
   * `CngxSelectConfig.commitErrorAnnouncePolicy`; default `{ kind: 'verbose',
   * severity: 'assertive' }`.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );

  /**
   * Quick-create handler run by the action slot's `commit()` with the live
   * search term and the draft `{ label }`; it resolves to the new value. `null`
   * disables creation and `commit()` becomes a no-op.
   */
  readonly quickCreateAction = input<CngxSelectCreateAction<T> | null>(null);
  /**
   * Whether a successful create closes the panel. Default `false` -
   * multi-pick UX keeps the panel open. Set `true` for confirm-to-
   * create workflows.
   */
  readonly closeOnCreate = input<boolean>(this.actionConfig.closeOnCreate ?? false);
  /**
   * Falls back to the raw `<input>` value when the debounced `searchTerm` has
   * not caught up. Disable it when the consumer owns the search pipeline.
   */
  readonly liveInputFallback = input<boolean>(this.actionConfig.liveInputFallback);
  /**
   * Position of the `*cngxSelectAction` slot in the panel: top, bottom, both or
   * none. Defaults to `CngxActionSelectConfig.actionPosition`.
   */
  readonly actionPosition = input<'top' | 'bottom' | 'both' | 'none'>(
    this.actionConfig.actionPosition,
  );
  /**
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxActionSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.actionConfig.popoverPlacement);
  /** Mobile `inputmode` of the input. Defaults to `CngxSelectConfig.inputMode`. */
  readonly inputMode = input<NonNullable<CngxSelectConfig['inputMode']>>(this.config.inputMode);
  /**
   * Mobile `enterkeyhint`. Default `'enter'` - Enter appends a chip
   * without closing the panel.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'enter',
  );
  /** Chip-strip overflow strategy. Defaults to `CngxSelectConfig.chipOverflow`. */
  readonly chipOverflow = input<NonNullable<CngxSelectConfig['chipOverflow']>>(
    this.config.chipOverflow,
  );
  /**
   * Maximum number of chips in `'truncate'` mode before the `+N` badge,
   * and the `'fit'` cap before the first measurement. Defaults to
   * `CngxSelectConfig.maxVisibleChips`.
   */
  readonly maxVisibleChips = input<number>(this.config.maxVisibleChips);

  /**
   * Selected values, two-way bindable as `[(values)]`. Syncs with the bound
   * field inside a `cngx-form-field`.
   */
  readonly values = model<T[]>([]);

  /**
   * Emits after a toggle, clear or create settles, with the new and previous
   * values, the added and removed values, the option and the action. With
   * `commitAction` bound it fires on commit success.
   */
  readonly selectionChange = output<CngxActionMultiSelectChange<T>>();
  /** Emits the toggled option and whether it was added, together with `selectionChange`. */
  readonly optionToggled = output<{
    readonly option: CngxSelectOptionDef<T>;
    readonly added: boolean;
  }>();
  /** Emits `true` when the panel opens and `false` when it closes. */
  readonly openedChange = output<boolean>();
  /** Emits when the panel opens. */
  readonly opened = output<void>();
  /** Emits when the panel closes. */
  readonly closed = output<void>();
  /** Emits when the clear button empties the selection, together with `selectionChange`. */
  readonly cleared = output<void>();
  /**
   * Emits when the built-in retry button is pressed after a failed load, after
   * `retryFn` has run.
   */
  readonly retry = output<void>();
  /**
   * Emits the error when `commitAction` fails; optimistic mode restores the
   * previous values. The error is also announced assertively by default;
   * `commitErrorAnnouncePolicy` changes that.
   */
  readonly commitError = output<unknown>();
  /** Emits each status of a `commitAction` run: `'pending'`, then `'success'` or `'error'`. */
  readonly stateChange = output<AsyncStatus>();
  /** Emits the search term as the user types into the input, after `searchDebounceMs`. */
  readonly searchTermChange = output<string>();
  /** Emits the created option after a successful create, right after `selectionChange`. */
  readonly created = output<CngxSelectOptionDef<T>>();

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly loadingGlyphDirective =
    contentChild<CngxSelectLoadingGlyph>(CngxSelectLoadingGlyph);
  private readonly triggerLabelDirective =
    contentChild<CngxComboboxTriggerLabel<T>>(CngxComboboxTriggerLabel);
  private readonly optionLabelDirective =
    contentChild<CngxSelectOptionLabel<T>>(CngxSelectOptionLabel);
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDirective =
    contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
  private readonly refreshingDirective = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective =
    contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly chipDirective = contentChild<CngxMultiSelectChip<T>>(CngxMultiSelectChip);
  private readonly chipOverflowDirective =
    contentChild<CngxSelectChipOverflow<T>>(CngxSelectChipOverflow);
  private readonly clearButtonDirective =
    contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective =
    contentChild<CngxSelectOptionPending<T>>(CngxSelectOptionPending);
  private readonly optionErrorDirective =
    contentChild<CngxSelectOptionError<T>>(CngxSelectOptionError);
  private readonly sheetHandleDirective = contentChild(CngxSelectSheetHandle);
  private readonly inputPrefixDirective =
    contentChild<CngxSelectInputPrefix>(CngxSelectInputPrefix);
  private readonly inputSuffixDirective =
    contentChild<CngxSelectInputSuffix>(CngxSelectInputSuffix);
  private readonly actionDirective = contentChild<CngxSelectAction>(CngxSelectAction);

  /** @internal */
  protected readonly tpl = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    check: this.checkDirective,
    caret: this.caretDirective,
    optgroup: this.optgroupDirective,
    empty: this.emptyDirective,
    loading: this.loadingDirective,
    loadingGlyph: this.loadingGlyphDirective,
    optionLabel: this.optionLabelDirective,
    error: this.errorDirective,
    retryButton: this.retryButtonDirective,
    refreshing: this.refreshingDirective,
    commitError: this.commitErrorDirective,
    clearButton: this.clearButtonDirective,
    optionPending: this.optionPendingDirective,
    optionError: this.optionErrorDirective,
    sheetHandle: this.sheetHandleDirective,
    action: this.actionDirective,
  });
  /** @internal */
  protected readonly triggerLabelTpl = computed<TemplateRef<
    CngxComboboxTriggerLabelContext<T>
  > | null>(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** @internal */
  protected readonly chipTpl = computed<TemplateRef<CngxMultiSelectChipContext<T>> | null>(
    () => this.chipDirective()?.templateRef ?? null,
  );
  /** @internal */
  protected readonly chipOverflowTpl = computed<TemplateRef<
    CngxSelectChipOverflowContext<T>
  > | null>(() => this.chipOverflowDirective()?.templateRef ?? null);
  /** @internal */
  protected readonly inputPrefixTpl = computed<TemplateRef<CngxSelectInputSlotContext> | null>(
    () => this.inputPrefixDirective()?.templateRef ?? null,
  );
  /** @internal */
  protected readonly inputSuffixTpl = computed<TemplateRef<CngxSelectInputSlotContext> | null>(
    () => this.inputSuffixDirective()?.templateRef ?? null,
  );

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly searchInputRef = viewChild(CngxListboxSearch);
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);
  private readonly sheetRef = viewChild(CngxPopoverSheet);
  private readonly listboxEl = viewChild<CngxListbox, ElementRef<HTMLElement>>(CngxListbox, {
    read: ElementRef,
  });

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);
  readonly searchTerm: Signal<string> = computed(() => this.searchInputRef()?.term() ?? '');

  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal Field-facing focus and touched: focus inside the host, panel included. */
  protected readonly hostFocus = createHostFocusWithin({
    onLeave: () => this.presenter?.fieldState().markAsTouched(),
    // Closure: the sheet wiring is declared further down in field order.
    close: () => this.sheetWiring.handleFocusLeave(),
    owner: () => this.inputEl()?.nativeElement,
    restoreFocus: this.config.restoreFocus,
    suppressOpenOnFocus: (active) => {
      this.suppressOpenOnFocus = active;
      this.sheetWiring.handleTriggerRefocus(active);
    },
  });
  /** @internal */ readonly focused = this.hostFocus.focusedWithin;
  readonly empty = computed<boolean>(() => this.isEmpty());

  /** @internal `[searchMatchFn]` > `CngxSelectConfig.searchMatchFn` > folded label match. */
  protected readonly effectiveMatchFn = resolveSearchMatch(
    this.searchMatchFn,
    this.config,
    injectLocale(),
  );

  /** @internal - `effectiveMatchFn` as the listbox search input takes it. */
  protected readonly listboxMatchFn = computed(() => toListboxMatchFn(this.effectiveMatchFn()));

  private readonly filter = computed<
    ((input: CngxSelectOptionsInput<T>) => CngxSelectOptionsInput<T>) | null
  >(() => {
    const term = this.searchTerm();
    if (term === '') {
      return null;
    }
    const matcher = this.effectiveMatchFn();
    return (all) => filterSelectOptions<T>(all, term, matcher);
  });

  /** @internal */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(this.compareWith);

  /**
   * Dedicated commit controller for quick-create. The toggle/clear
   * path runs through `core.commitController` (typed `T[]` because
   * `ArrayCommitHandler` reconciles the full array); create
   * materialises a single `T`, so needs a `T`-typed controller.
   * Splitting them also preserves independent supersede semantics
   * - create-in-flight doesn't cancel a pending toggle and vice versa.
   *
   * @internal
   */
  private readonly createCommitController = inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY)<T>();

  /** Draft label of the last dispatched quick-create; names it in the failure copy. */
  private readonly lastCreateLabel = signal('');

  /**
   * A pick after a failed quick-create clears its error: the user moved on.
   * Every new create status starts uncleared again.
   */
  private readonly createErrorCleared = linkedSignal<AsyncStatus, boolean>({
    source: this.createCommitController.state.status,
    computation: () => false,
  });

  /** Failure sentence of the last quick-create while it is in error, else `null`. */
  private readonly createErrorMessage = computed<string | null>(() => {
    const state = this.createCommitController.state;
    if (state.status() !== 'error' || this.createErrorCleared()) {
      return null;
    }
    return this.core.createFailedMessage(this.lastCreateLabel(), state.error());
  });

  /** @internal */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
    commit: (draft) => this.handleActionCommit(draft),
    retry: () => this.createHandler.retryLast(),
    isPending: computed(() => this.createCommitController.isCommitting()),
  });
  /** @internal */ readonly actionDirty = this.actionBridge.dirty;
  /** @internal */ readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */ readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;
  /**
   * Live search term for `*cngxSelectAction`'s `$implicit` +
   * `searchTerm` slot fields.
   *
   * @internal
   */
  readonly actionSearchTerm = this.searchTerm;
  /**
   * Action context's `error` + `hasError` source. Reflects create
   * failures only - toggle errors flow through the shell's
   * commit-error banner via the array-typed `core.commitController`.
   *
   * @internal
   */
  readonly actionError = computed<unknown>(() => this.createCommitController.state.error());
  /**
   * Action context's `value` source. Forwards the live values array.
   *
   * @internal
   */
  readonly actionValue = computed<unknown>(() => this.values());

  private readonly core: CngxSelectCore<T, T[]> = createSelectCore<T, T[]>(
    {
      label: this.label,
      ariaLabel: this.ariaLabel,
      ariaLabelledBy: this.ariaLabelledBy,
      placeholder: this.placeholder,
      idInput: this.idInput,
      disabledInput: this.disabledInput,
      requiredInput: this.requiredInput,
      tabIndex: this.tabIndex,
      options: this.options,
      state: this.state,
      loading: this.loading,
      compareWith: this.compareWith,
      skeletonRowCount: this.skeletonRowCount,
      panelClass: this.panelClass,
      panelWidth: this.panelWidth,
      hideSelectionIndicator: this.hideSelectionIndicator,
      hideCaret: this.hideCaret,
      commitErrorDisplay: this.commitErrorDisplay,
      commitAction: this.commitAction,
      filter: this.filter,
      multi: computed(() => true),
      currentSelection: this.values,
      multiValues: this.values,
      selectionIndicatorPosition: this.selectionIndicatorPosition,
      selectionIndicatorVariant: this.selectionIndicatorVariant,
      localItems: this.localItemsBuffer.items,
      presentationInput: this.presentation,
      // Lazy: the wiring is built from the core right below.
      presentation: computed<CngxPopoverPresentation>(() => this.sheetWiring.presentation()),
      // Lazy: the create controller is built below the core.
      createErrorMessage: this.createErrorMessage,
      // Lazy: the summary is declared further down in field order.
      summaryDescribedBy: computed<string | null>(() => this.summaryDescribedBy()),
    },
    {
      announceChanges: this.announceChanges,
      announceTemplate: this.announceTemplate,
    },
  );

  /** Whether the bound field shows its error; `false` without a form field. */
  readonly errorState: Signal<boolean> = this.core.errorState;

  /** @internal Mobile sheet presentation; also the scoped announcer's scope. */
  readonly sheetWiring: CngxSelectSheetWiring = createSelectSheetWiring({
    popupRole: 'listbox',
    core: this.core,
    sheet: this.sheetRef,
    popoverRef: this.popoverRef,
    listboxRef: this.listboxRef,
    tpl: this.tpl,
    commitMode: this.commitMode,
    dismissOn: this.config.dismissOn,
    shouldBlockDismiss: this.actionBridge.shouldBlockDismiss,
    showDone: true,
    showInput: true,
    sheetLabel: this.sheetLabel,
    label: this.label,
    searchTerm: this.searchTerm,
    searchInput: this.inputEl,
    inputMode: this.inputMode,
    close: () => this.close(),
  });
  /** @internal Static height fact: a fullscreen panel led by the header input. */
  protected readonly sheetFill = 'fullscreen';

  /**
   * Append a pre-built option to the local buffer. Used internally by the
   * create-commit handler; exposed for consumer pre-seed (recent-items, history
   * workflows).
   */
  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

  /** Reset the local buffer. Idempotent. */
  clearLocalItems(): void {
    this.localItemsBuffer.clear();
  }

  /** @internal */
  protected readonly flatOptions = this.core.flatOptions;
  /** @internal */
  protected readonly activeView = this.core.activeView;
  /** @internal */
  protected readonly showRefreshIndicator = this.core.showRefreshIndicator;
  /** @internal */
  protected readonly panelClassList = this.core.panelClassList;
  /** @internal */
  protected readonly panelWidthCss = this.core.panelWidthCss;
  /** @internal */
  readonly fallbackLabels = this.core.fallbackLabels;
  /** @internal */
  readonly ariaLabels = this.core.ariaLabels;
  /** @internal */
  protected readonly resolvedId = this.core.resolvedId;
  /** @internal */
  protected readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  /** @internal */
  protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */
  protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly commitErrorId = this.core.commitErrorId;
  /** @internal */ protected readonly disabledReasonId = this.core.disabledReasonId;
  /** @internal */ protected readonly disabledReasonText = this.core.disabledReasonText;
  /** @internal */ protected readonly listboxId = this.core.listboxId;
  /** @internal */ protected readonly commitErrorText = this.core.commitErrorText;
  /** @internal */
  /** @internal */
  protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */
  protected readonly externalActivation = this.core.externalActivation;

  readonly disabled = this.core.disabled;
  /** @internal - disabled or readonly: every write path refuses, the panel still opens. */
  protected readonly writeBlocked = this.core.writeBlocked;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  /** @internal */
  protected readonly inputSlotContext = computed<CngxSelectInputSlotContext>(
    () => ({
      disabled: this.disabled(),
      focused: this.focusState.focused(),
      panelOpen: this.panelOpen(),
    }),
    {
      equal: (a, b) =>
        a.disabled === b.disabled && a.focused === b.focused && a.panelOpen === b.panelOpen,
    },
  );

  /**
   * Toggle/clear surface with the quick-create machine overlaid: create
   * pending/error win while active, so `CNGX_STATEFUL` consumers see a
   * quick-create in flight - the status counterpart of the `isCommitting`
   * merge below.
   */
  readonly commitState = mergeCommitState(this.core.commitState, this.createCommitController.state);
  /**
   * `true` while either the toggle/clear or quick-create commit is
   * pending. The two run on separate controllers but a consumer
   * observing "is any write in flight?" gets a single truthy signal.
   */
  readonly isCommitting = computed<boolean>(
    () => this.core.isCommitting() || this.createCommitController.isCommitting(),
  );

  /** @internal - full virtualisation wire-up (see setupVirtualization). */
  private readonly virtualSetup = setupVirtualization<T, T[]>({
    core: this.core,
    popoverRef: this.popoverRef,
    listboxRef: this.listboxRef,
    virtualization: this.config.virtualization,
    presentation: this.sheetWiring.presentation,
    listboxElement: computed(() => this.listboxEl()?.nativeElement),
  });
  /** @internal */
  readonly panelRenderer = this.virtualSetup.panelRenderer;
  /** @internal */
  readonly autoRecycler = this.virtualSetup.autoRecycler;
  /** @internal */
  protected readonly virtualItemCount = this.virtualSetup.virtualItemCount;
  protected readonly virtualWindowStart = this.virtualSetup.virtualWindowStart;
  protected readonly virtualTypeaheadItems = this.virtualSetup.virtualTypeaheadItems;

  readonly selected: Signal<readonly CngxSelectOptionDef<T>[]> = computed(
    () => this.selectedOptions(),
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        const eq = this.compareWith() as CngxSelectCompareFn<unknown>;
        for (let i = 0; i < a.length; i++) {
          if (!eq(a[i].value, b[i].value)) {
            return false;
          }
        }
        return true;
      },
    },
  );

  /** @internal */
  protected readonly effectivePlaceholder = computed<string>(() => {
    if (!this.isEmpty()) {
      return '';
    }
    return this.core.resolvedPlaceholder();
  });

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // Every value draws a chip, matched or not: resolution runs against the
  // unfiltered option merge (a search term never hides a picked chip) and a
  // value with no option yet gets a fallback labelled from the value, so the
  // strip agrees with `isEmpty`.
  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => this.core.resolveSelectedOptions(this.values()),
    {
      equal: (a, b) => sameArrayContents(a, b, Object.is),
    },
  );

  /**
   * @internal - one-line summary in front of the input instead of chips under
   * the touch floor. The chip strip below is its truncated-at-one derivation
   * while it is active.
   */
  private readonly fitStrip = viewChild(CngxSelectChipFitStrip);
  protected readonly summary = createSelectSummary<T>({
    selectedOptions: this.selectedOptions,
    active: injectTouchFloorSignal(),
    chipOverflow: this.chipOverflow,
    maxVisibleChips: this.maxVisibleChips,
    fitSnapshot: computed(() => this.fitStrip()?.snapshot() ?? null),
    ariaLabels: this.config.ariaLabels,
    fallbackLabels: this.config.fallbackLabels,
  });
  /**
   * @internal - id of the sr-only node with the whole selection. The input's
   * value is the search term, so the selection reaches AT as a description.
   */
  protected readonly summaryDescriptionId = nextUid('cngx-action-multi-select-summary');
  /**
   * @internal - the description reference, gated on a shown summary or on a
   * truncated strip that hides values behind its `aria-hidden` badge.
   */
  private readonly summaryDescribedBy = computed<string | null>(() =>
    this.summary.accessibleText() !== '' && !this.triggerLabelTpl()
      ? this.summaryDescriptionId
      : null,
  );
  private readonly chipStrip = this.summary.strip;
  /** @internal */
  protected readonly overflowBadgeCount = this.chipStrip.overflowBadgeCount;
  /** @internal Selected options the truncated strip hides, for the overflow slot. */
  protected readonly hiddenSelected = this.chipStrip.hiddenSelected;
  /** @internal Visible `+N` badge text, the count in the reading locale's digits. */
  protected readonly overflowBadgeText = computed<string>(() =>
    this.config.fallbackLabels().chipOverflowBadge(this.overflowBadgeCount()),
  );

  private readonly togglingOption = this.core.togglingOption;
  private readonly hasEmittedInitial = signal(false);

  /**
   * Toggle/clear finalize + AD-activation dispatch. Shared with
   * `CngxMultiSelect` / `CngxCombobox` / `CngxReorderableMultiSelect`;
   * this variant adds `source: this` and clears a stale quick-create error
   * on a pick.
   */
  private readonly toggleDispatch = createArrayToggleDispatch<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    commitAction: this.commitAction,
    core: this.core,
    beginToggle: (next, previous, option, action) =>
      this.commitHandler.beginToggle(next, previous, option, action),
    beginClear: (previous, action) => this.commitHandler.beginClear(previous, action),
    emitOptionToggled: (option, added) => this.optionToggled.emit({ option, added }),
    emitSelectionChange: (change) => this.selectionChange.emit({ source: this, ...change }),
    emitCleared: () => this.cleared.emit(),
    onToggled: (_option, isNowSelected) => {
      if (isNowSelected) {
        this.createErrorCleared.set(true);
      }
    },
  });

  /** A rejected quick-create is spoken assertively, whatever the select's own policy. */
  private readonly announceCreateError = this.core.createCommitErrorAnnouncer({
    policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'verbose', severity: 'assertive' }),
    message: (err) => this.core.createFailedMessage(this.lastCreateLabel(), err),
  });
  private readonly announceCommitError = this.core.createCommitErrorAnnouncer({
    policy: this.commitErrorAnnouncePolicy,
  });

  private readonly commitHandler: ArrayCommitHandler<T> = inject(
    CNGX_ARRAY_COMMIT_HANDLER_FACTORY,
  )<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    core: this.core,
    commitAction: this.commitAction,
    onToggleFinalize: (option, isNowSelected, previous) =>
      this.toggleDispatch.finalizeToggle(option, isNowSelected, previous),
    onClearFinalize: (previous, finalValues) =>
      this.toggleDispatch.clearFinalize(previous, finalValues),
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
    announceError: this.announceCommitError,
  });

  /**
   * Create-commit handler. Same primitive `CngxActionSelect` uses;
   * `onCreated` carries the multi-value semantic (append, not replace).
   *
   * @internal
   */
  private readonly createHandler: CreateCommitHandler<T, readonly T[]> = inject(
    CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  )<T, readonly T[]>({
    quickCreateAction: this.quickCreateAction,
    commitController: this.createCommitController,
    localItemsBuffer: this.localItemsBuffer,
    closeOnSuccess: this.closeOnCreate,
    onCreated: (option, previousValues) => {
      // No dedup - quickCreateAction is intentional, the value is fresh by definition.
      // Merge into the LIVE values, not the dispatch snapshot: chips the user
      // added or removed while the create was in flight must survive. The
      // snapshot `previousValues` feeds only the event payload.
      const live = untracked(this.values);
      const next = [...live, option.value];
      this.values.set(next);
      // Tag-input UX: clear the term so the next chip can be typed. CngxActionSelect
      // takes the opposite branch and writes displayWith(value) instead.
      this.searchInputRef()?.clear();
      this.optionToggled.emit({ option, added: true });
      this.selectionChange.emit({
        source: this,
        values: next,
        previousValues,
        added: [option.value],
        removed: [],
        option,
        action: 'create',
      });
      this.created.emit(option);
    },
    onAnnounce: (option) => {
      this.core.announce(option, 'created', this.values().length, true);
    },
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => {
      this.announceCreateError(err);
      this.commitError.emit(err);
    },
    onClose: () => this.close(),
    onResetDirty: () => this.actionBridge.reset(),
  });

  /**
   * Object behind `CNGX_SELECT_PANEL_HOST` and `CNGX_SELECT_PANEL_VIEW_HOST`;
   * the core supplies every shared key.
   *
   * @internal
   */
  readonly panelHost = this.core.createPanelHost({
    activeView: this.core.activeView,
    showInlineError: this.core.showInlineError,
    tpl: this.tpl,
    loadingVariant: this.loadingVariant,
    refreshingVariant: this.refreshingVariant,
    errorContext: this.core.makeErrorContext(() => this.handleRetry()),
    commitErrorContext: this.core.bindCommitRetry(() => {
      this.hostFocus.refocusOwnerBeforeRemoval();
      this.commitHandler.retryLast();
    }),
    handleRetry: () => this.handleRetry(),
    listboxCompareWith: this.listboxCompareWith,
    activeId: this.activeId,
    panelOpen: this.panelOpen,
    patchData: (item) => this.patchData(item),
    clearLocalItems: () => this.clearLocalItems(),
    panelRenderer: this.panelRenderer,
    autoRecycler: this.autoRecycler,
    searchTerm: this.searchTerm,
    actionDirty: this.actionDirty,
    actionCallbacks: this.actionCallbacks,
    actionFocusTrapEnabled: this.actionFocusTrapEnabled,
    actionSearchTerm: this.actionSearchTerm,
    actionPosition: this.actionPosition,
    actionError: this.actionError,
    actionValue: this.actionValue,
    isCommitting: this.isCommitting,
  });

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  /**
   * Chip-removal handler. Action-host is independent of chip-remove
   * (action dispatches happen via the panel, not the chips), so wiring
   * is identical to `CngxMultiSelect`.
   */
  private readonly chipRemovalHandler: CngxChipRemovalHandler<CngxSelectOptionDef<T>> = inject(
    CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  )<T>({
    values: this.values,
    disabled: this.core.writeBlocked,
    compareWith: this.compareWith,
    commitAction: this.commitAction,
    commitMode: this.commitMode,
    beginCommit: (next, previous, item, action) =>
      this.commitHandler.beginToggle(next, previous, item, action),
    onBeforeCommit: (item) => this.togglingOption.set(item),
    onSyncFinalize: (item, previous) => this.toggleDispatch.finalizeToggle(item, false, previous),
  });

  /** @internal - stable per-option `remove()` closure for chip slots. */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    return this.hostFocus.withRefocus(this.chipRemovalHandler.removeFor(opt));
  }

  constructor() {
    // Same teardown as the core's select controller: a create that settles
    // after the host is destroyed is dropped.
    inject(DestroyRef).onDestroy(() => this.createCommitController.cancel());
    injectChipFitFocusHandOff({
      strip: this.fitStrip,
      visibleCount: this.chipStrip.visibleCount,
      target: () => this.inputEl()?.nativeElement,
    });

    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    createADActivationDispatcher<T, T[]>({
      beforeHide: () => this.hostFocus.refocusOwnerBeforeClose(),
      listboxRef: this.listboxRef,
      core: this.core,
      closeOnSelect: false,
      commitAction: this.commitAction,
      onCommit: this.toggleDispatch.handleADCommit,
      onActivate: this.toggleDispatch.handleADActivate,
    });

    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.inputEl,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
      restoringFocus: (active) => {
        this.suppressOpenOnFocus = active;
        this.sheetWiring.handleTriggerRefocus(active);
      },
    });

    createFieldSync<T[]>({
      componentValue: this.values,
      valueEquals: (a, b) => sameArrayContents(a, b, this.compareWith()),
      coerceFromField: (x) => (Array.isArray(x) ? [...(x as T[])] : []),
      toFieldValue: (v) => [...v],
    });

    inject(CNGX_SEARCH_EFFECTS_FACTORY)({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      readonly: this.core.readonly,
      focused: this.focusState.focused,
      open: () => this.open(),
      emit: {
        hasEmittedInitial: this.hasEmittedInitial,
        skipInitial: this.skipInitial,
        onEmit: (term) => this.searchTermChange.emit(term),
      },
      results: searchResultsFrom({
        count: () => this.flatOptions().length,
        activeView: this.activeView,
        refreshing: this.showRefreshIndicator,
        ariaLabels: this.config.ariaLabels,
      }),
    });
  }

  /**
   * Opens the panel. On a disabled control the panel closes again at once, so
   * the call has no effect.
   */
  open(): void {
    this.popoverRef()?.show();
  }
  /**
   * Closes the panel. With `CngxSelectConfig.restoreFocus` on, focus moves back
   * to the trigger first.
   */
  close(): void {
    this.hostFocus.refocusOwnerBeforeClose();
    this.popoverRef()?.hide();
  }
  /**
   * Opens the panel when it is closed and closes it when it is open. On a
   * disabled control an open is undone at once, as with `open()`.
   */
  toggle(): void {
    this.popoverRef()?.toggle();
  }
  /** Moves focus to the trigger, passing the given `FocusOptions` through. */
  focus(options?: FocusOptions): void {
    this.inputEl()?.nativeElement.focus(options);
  }

  /** Flat-nav policy via `CNGX_FLAT_NAV_STRATEGY`: picks the PageUp/PageDown target. */
  private readonly flatNavStrategy = inject(CNGX_FLAT_NAV_STRATEGY);

  /**
   * Trigger-input keyboard + live-term dispatch. Shared with
   * `CngxActionSelect`; this variant snapshots the values array.
   */
  private readonly triggerInput = createActionTriggerInput<readonly T[], T>({
    listbox: this.listboxRef,
    popover: this.popoverRef,
    strategy: this.flatNavStrategy,
    compareWith: this.compareWith,
    flatOptions: () => this.core.flatOptions(),
    input: this.inputEl,
    searchTerm: this.searchTerm,
    liveInputFallback: this.liveInputFallback,
    hasQuickCreateAction: () => this.quickCreateAction() !== null,
    snapshotPrevious: () => [...this.values()],
    dispatch: (draft, term, previous) => {
      if (this.core.writeBlocked()) {
        return;
      }
      this.lastCreateLabel.set(draft.label);
      this.createHandler.dispatch(draft, term, previous);
    },
  });

  /** @internal - Enter-to-quick-create, tag-input UX: type, Enter, chip appears. */
  protected readonly handleTriggerEnter = this.triggerInput.handleTriggerEnter;
  /** @internal - PageUp/PageDown shared behaviour (±10 option jump). */
  protected readonly handleInputKeydown = this.triggerInput.handleInputKeydown;
  private readonly handleActionCommit = this.triggerInput.handleActionCommit;

  /** Descendants that own their own click; `CNGX_NESTED_INTERACTIVE_SELECTOR`. */
  private readonly nestedInteractive = inject(CNGX_NESTED_INTERACTIVE_SELECTOR);

  private readonly inputHost = createInputHostHandlers({
    focusState: this.focusState,
    hostFocus: this.hostFocus,
    openOn: () => this.config.openOn,
    open: () => this.open(),
    suppressOpenOnFocus: () => this.suppressOpenOnFocus,
    disabled: () => this.disabled(),
    panelOpen: () => this.panelOpen(),
    focus: () => this.focus(),
    inputEl: () => this.inputEl()?.nativeElement,
    nestedInteractive: this.nestedInteractive,
    reloadFn: () => this.retryFn(),
    retry: () => this.retry.emit(),
  });
  /** @internal */
  protected readonly handleWrapperClick = this.inputHost.handleWrapperClick;
  /** @internal */
  protected readonly handleRetry = this.inputHost.handleRetry;
  /** @internal */
  protected readonly handleFocus = this.inputHost.handleFocus;
  /** @internal */
  protected readonly handleBlur = this.inputHost.handleBlur;

  /** @internal - click-outside dismissal (action-dirty-guarded). */
  protected readonly handleClickOutside = this.sheetWiring.handleClickOutside;

  protected handleChipRemoveClick(event: Event, opt: CngxSelectOptionDef<T>): void {
    event.stopPropagation();
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.chipRemovalHandler.removeByValue(opt);
  }

  /**
   * @internal - invoked by `CngxListboxTrigger`'s `(backspaceOnEmpty)`.
   * Routes through the same commit-aware path and the same owner refocus as
   * the chip remove button.
   */
  protected removeLastChip(): void {
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return;
    }
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.chipRemovalHandler.removeByValue(selected[selected.length - 1]);
  }

  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAllCallback();
  }

  /** @internal - imperative clear-all used by slot + default button. */
  protected readonly clearAllCallback: () => void = this.hostFocus.withRefocus(() => {
    if (this.core.writeBlocked()) {
      return;
    }
    this.toggleDispatch.clearAll();
  });

  // True only inside the lifecycle emitter's post-close focus restore -
  // the programmatic refocus must not re-open under openOn: 'focus'.
  private suppressOpenOnFocus = false;

}
