import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
  ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import {
  CNGX_STATEFUL,
  injectLocale,
  type CngxAsyncState,
  type AsyncStatus,
} from '@cngx/core/utils';

import { CngxChip } from '@cngx/common/display';
import { CngxClickOutside, CngxListbox, CngxListboxTrigger } from '@cngx/common/interactive';
import {
  CngxPopover,
  CngxPopoverSheet,
  CngxPopoverSheetInitialFocus,
  CngxPopoverTrigger,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationRequest,
  type PopoverPlacement,
} from '@cngx/common/popover';

import { injectSelectCopy } from '../i18n/select-i18n';
import { CngxSelectPanel } from '../shared/internal/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFieldSkinHost,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { createArrayCommitHandler, type ArrayCommitHandler } from '../shared/array-commit-handler';
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
import { CNGX_SELECT_SHEET_HEADER_HOST } from '../shared/sheet-header-host';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
import {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
import { createArrayToggleDispatch } from '../shared/internal/array-toggle';
import { CngxSelectSummary } from '../shared/internal/summary/select-summary.component';
import { createSelectSummary } from '../shared/internal/summary/select-summary';
import { injectTouchFloorSignal } from '../shared/internal/touch-floor';
import { sameArrayContents } from '../shared/internal/compare';
import { handleFlatNavPageJumpKey } from '../shared/internal/page-jump-handler';
import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import { createTypeaheadController } from '../shared/typeahead-controller';
import { CNGX_FLAT_NAV_STRATEGY } from '../shared/flat-nav-strategy';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from '../shared/panel-host';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitErrorDisplay,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
  type CngxSelectSelectionIndicatorVariant,
} from '../shared/config';
import { type CngxSelectOptionDef, type CngxSelectOptionsInput } from '../shared/option.model';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import { createHostFocusWithin } from '../shared/internal/host-focus-within';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
  type CngxSelectCore,
} from '../shared/internal/select-core';
import {
  CngxMultiSelectChip,
  type CngxMultiSelectChipContext,
  CngxSelectChipOverflow,
  type CngxSelectChipOverflowContext,
  CngxMultiSelectTriggerLabel,
  type CngxMultiSelectTriggerLabelContext,
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectRetryButton,
  CngxSelectLoading,
  CngxSelectLoadingGlyph,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectSheetHandle,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxMultiSelect.selectionChange}.
 */
export interface CngxMultiSelectChange<T = unknown> {
  readonly source: CngxMultiSelect<T>;
  readonly values: readonly T[];
  /**
   * Values before the change committed. Populated from the pre-toggle
   * snapshot, the commit-controller rollback target on success, and the
   * pre-clear array. Plural disambiguates from scalar `previousValue`.
   */
  readonly previousValues?: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear' | 'select-all';
}

/**
 * Multi-select sibling of {@link CngxSelect}. Stateless graph in
 * {@link createSelectCore}; keeps the multi-specific trigger template,
 * chip strip, AD-activated dispatch, keyboard, and Field↔sync.
 *
 * Slot tiers: `cngxSelectCheck`, `cngxSelectCaret`, `cngxSelectOptgroup`,
 * `cngxSelectPlaceholder`, `cngxSelectEmpty`, `cngxSelectLoading`,
 * `cngxSelectOptionLabel`, `cngxSelectError`, `cngxSelectRetryButton`,
 * `cngxSelectRefreshing`, `cngxSelectCommitError`, `cngxSelectClearButton`,
 * `cngxSelectOptionPending` and `cngxSelectOptionError` also take an
 * app-wide default through `CNGX_SELECT_CONFIG.templates` (`withTemplates`);
 * `cngxMultiSelectTriggerLabel`, `cngxMultiSelectChip` and
 * `cngxSelectChipOverflow` are directive-only.
 * `cngxSelectLoadingGlyph` resolves from the projected directive first and
 * `templates.loadingGlyph` second.
 *
 * **Mobile sheet.** On a coarse screen narrower than 48rem the panel opens as
 * a modal bottom sheet: a `role="dialog"` named by the field label, with a
 * close button, Done and a decorative handle (`*cngxSelectSheetHandle`).
 * Focus moves into the sheet on open and back to the trigger on close, the
 * rest of the page is inert, and announcements are spoken from inside the
 * sheet. `[presentation]` forces `'anchored'`, `'sheet'` or `'fullscreen'`;
 * `withMobileSheet('off')` keeps every select in its scope anchored.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/multi-select/multi-select.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxCombobox, CngxReorderableMultiSelect, CngxTreeSelect, CngxMultiSelectChip
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/multi-select/multi-basic</example-url>
 * <example-url>http://localhost:4200/#/forms/select/multi-select/multi-clearable</example-url>
 * <example-url>http://localhost:4200/#/forms/select/multi-select/multi-custom-cngxmultiselectchip-template</example-url>
 * <example-url>http://localhost:4200/#/forms/select/multi-select/multi-text-summary-via-cngxmultiselecttriggerlabel</example-url>
 * <example-url>http://localhost:4200/#/forms/select/mobile-sheet/all-variants</example-url>
 * @slot cngxSelectCheck Replaces the checkbox indicator on each option row unless hideSelectionIndicator is set; gets option, selected, variant, position, and indeterminate (always false here, absent under the radio variant).
 * @slot cngxSelectCaret Replaces the trigger caret unless hideCaret is set; gets open.
 * @slot cngxSelectOptgroup Replaces the header of each option group in the panel; gets group.
 * @slot cngxSelectPlaceholder Renders in the trigger while nothing is selected; gets placeholder.
 * @slot cngxSelectEmpty Replaces the panel's empty message when there are no options; searchTerm is always '' on this host.
 * @slot cngxSelectLoading Replaces the panel's loading indicator during the first load of [state], or while [loading] is true without [state]; gets retry.
 * @slot cngxSelectLoadingGlyph Replaces the inner glyph of the spinner or bar loading view and of the refresh indicator when no cngxSelectLoading / cngxSelectRefreshing template is set; no context.
 * @slot cngxMultiSelectTriggerLabel Replaces the whole chip strip, and the touch summary, while at least one value is selected; gets selected, values, count.
 * @slot cngxSelectOptionLabel Replaces the label content of each option row; gets option, selected, highlighted.
 * @slot cngxSelectError Replaces the panel's error block on a failed load and the inline error above the options on a failed refresh; gets error, retry.
 * @slot cngxSelectRetryButton Replaces the retry button inside the built-in load-error, inline-error and commit-error blocks; gets retry, error, disabled, label.
 * @slot cngxSelectRefreshing Replaces the refresh indicator shown above the options while a reload runs; previousCount is always 0 on this host.
 * @slot cngxSelectCommitError Replaces the panel's commit-error banner when a commit fails and commitErrorDisplay is 'banner'; gets error, option, retry.
 * @slot cngxMultiSelectChip Replaces each chip in the trigger strip unless cngxMultiSelectTriggerLabel is projected; gets option, remove. Fine pointer only.
 * @slot cngxSelectChipOverflow Replaces the +N badge after the visible chips when chipOverflow is 'truncate' and selected options are hidden, and the badge of the touch summary; gets count, label, hidden. The chip-strip badge is fine pointer only.
 * @slot cngxSelectClearButton Replaces the clear-all button, shown when clearable is set, a value is selected and the control is enabled; gets clear, disabled.
 * @slot cngxSelectOptionPending Replaces the spinner on an option row while its commit is in flight; gets option.
 * @slot cngxSelectOptionError Replaces the error mark on selected rows when a commit fails and commitErrorDisplay is 'inline'; gets option, error.
 * @slot cngxSelectSheetHandle Replaces the decorative drag handle of the mobile sheet, inside an aria-hidden wrapper; gets $implicit/presentation, dragging.
 * @axis level organism
 */
@Component({
  selector: 'cngx-multi-select',
  exportAs: 'cngxMultiSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxPopoverSheet,
    CngxPopoverSheetInitialFocus,
    CngxSelectSheetHeader,
    CngxChip,
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanel,
    CngxSelectSummary,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CngxSelectAnnouncer, useClass: CngxScopedSelectAnnouncer },
    { provide: CNGX_SELECT_SHEET_SCOPE, useFactory: () => inject(CngxMultiSelect).sheetWiring },
    {
      provide: CNGX_SELECT_SHEET_HEADER_HOST,
      useFactory: () => inject(CngxMultiSelect).sheetWiring.headerHost,
    },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxMultiSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxMultiSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxMultiSelect },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxMultiSelect },
  ],
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    class: 'cngx-multi-select',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '(focusin)': 'hostFocus.handleFocusIn()',
    '(focusout)': 'hostFocus.handleFocusOut($event)',
  },
  templateUrl: './multi-select.component.html',
  styleUrls: ['../shared/select-base.css', './multi-select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxMultiSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

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
  /** Trigger text while nothing is selected; falls back to `label` when unset. */
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
  /**
   * Host id. Unset, it takes the input id of an enclosing `cngx-form-field`,
   * else a generated id.
   */
  readonly idInput = input<string | null>(null, { alias: 'id' });
  /** Accessible name of the trigger. Wins over `label`. */
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
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  /** Chip-strip overflow strategy. See `CngxSelectConfig.chipOverflow`. */
  readonly chipOverflow = input<NonNullable<CngxSelectConfig['chipOverflow']>>(
    this.config.chipOverflow,
  );
  /** Max chips in `'truncate'` mode before the `+N` badge. */
  readonly maxVisibleChips = input<number>(this.config.maxVisibleChips);
  /**
   * Reset window in ms of the type-to-select buffer, so typed letters jump to
   * the matching option. Defaults to
   * `CngxSelectConfig.typeaheadDebounceInterval`.
   */
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);
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
   * Replaces the built-in `✕` glyph inside the default clear-all button.
   * Ignored when `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in caret glyph. Ignored when
   * `*cngxSelectCaret` is projected.
   */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  /** Renders a clear button while the selection is not empty and the control is enabled. */
  readonly clearable = input<boolean>(false);
  /** @internal The select section at this reading site; per-variant defaults. */
  private readonly selectCopy = injectSelectCopy();
  /**
   * Accessible name of the clear button. Unset, it reads
   * `CngxSelectConfig.ariaLabels.clearButton`, then the select copy of the
   * active language.
   */
  readonly clearButtonAriaLabel = input<string | undefined>(undefined);
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
   * Async write handler run on every user change with the intended value.
   * Unset, the change applies directly; `commitMode` sets the panel behaviour
   * while it runs.
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
   * Commit-error announce policy. `'verbose'` reads the error message into
   * the live region; `'soft'` announces a generic removal at the current
   * selection count. Per-instance input wins over
   * `CngxSelectConfig.commitErrorAnnouncePolicy`; default
   * `{ kind: 'verbose', severity: 'assertive' }`.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );
  /**
   * Selected values, two-way bindable as `[(values)]`. Syncs with the bound
   * field inside a `cngx-form-field`.
   */
  readonly values = model<T[]>([]);

  /**
   * Emits after a toggle or clear settles, with the new and previous values,
   * the added and removed values and the toggled option. With `commitAction`
   * bound it fires on commit success.
   */
  readonly selectionChange = output<CngxMultiSelectChange<T>>();
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

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly loadingGlyphDirective =
    contentChild<CngxSelectLoadingGlyph>(CngxSelectLoadingGlyph);
  private readonly triggerLabelDirective = contentChild<CngxMultiSelectTriggerLabel<T>>(
    CngxMultiSelectTriggerLabel,
  );
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

  /** @internal */
  protected readonly tpl = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    check: this.checkDirective,
    caret: this.caretDirective,
    optgroup: this.optgroupDirective,
    placeholder: this.placeholderDirective,
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
  });
  /** Multi-specific trigger-label - replaces chip strip. @internal */
  protected readonly triggerLabelTpl = computed<TemplateRef<
    CngxMultiSelectTriggerLabelContext<T>
  > | null>(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** Per-chip override. @internal */
  protected readonly chipTpl = computed<TemplateRef<CngxMultiSelectChipContext<T>> | null>(
    () => this.chipDirective()?.templateRef ?? null,
  );
  /** @internal */
  protected readonly chipOverflowTpl = computed<TemplateRef<
    CngxSelectChipOverflowContext<T>
  > | null>(() => this.chipOverflowDirective()?.templateRef ?? null);

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);
  private readonly sheetRef = viewChild(CngxPopoverSheet);
  private readonly listboxEl = viewChild<CngxListbox, ElementRef<HTMLElement>>(CngxListbox, {
    read: ElementRef,
  });

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** @internal */
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal Field-facing focus and touched: focus inside the host, panel included. */
  protected readonly hostFocus = createHostFocusWithin({
    onLeave: () => this.presenter?.fieldState().markAsTouched(),
    // Closure: the sheet wiring is declared further down in field order.
    close: () => this.sheetWiring.handleFocusLeave(),
    owner: () => this.triggerBtn()?.nativeElement,
    restoreFocus: this.config.restoreFocus,
    suppressOpenOnFocus: (active) => {
      this.suppressOpenOnFocus = active;
    },
  });
  /** @internal */ readonly focused = this.hostFocus.focusedWithin;

  readonly empty = computed<boolean>(() => this.isEmpty());

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  /** @internal */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(this.compareWith);

  /** @internal */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
  });
  /** @internal */ readonly actionDirty = this.actionBridge.dirty;
  /** @internal */ readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */ readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;

  /**
   * Family-shared signal graph. Owns every derivation identical across
   * `CngxSelect` / `CngxCombobox`.
   *
   * @internal
   */
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
      errorState: this.errorState,
      multi: computed(() => true),
      currentSelection: this.values,
      multiValues: this.values,
      selectionIndicatorPosition: this.selectionIndicatorPosition,
      selectionIndicatorVariant: this.selectionIndicatorVariant,
      localItems: this.localItemsBuffer.items,
      presentationInput: this.presentation,
      // Lazy: the wiring is built from the core right below.
      presentation: computed<CngxPopoverPresentation>(() => this.sheetWiring.presentation()),
    },
    {
      announceChanges: this.announceChanges,
      announceTemplate: this.announceTemplate,
    },
  );

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
    showInput: false,
    sheetLabel: this.sheetLabel,
    label: this.label,
    close: () => this.close(),
  });
  /** @internal Static height fact: a content-sized sheet. */
  protected readonly sheetFill = 'sheet';

  /**
   * Append a pre-built option to the local buffer. Renders in the next
   * panel emission and silently drops once the server includes a
   * matching value. Idempotent under `compareWith`.
   */
  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

  /**
   * Reset the local buffer. Idempotent.
   */
  clearLocalItems(): void {
    this.localItemsBuffer.clear();
  }

  /** @internal */ protected readonly effectiveOptions = this.core.effectiveOptions;
  /** @internal */ protected readonly flatOptions = this.core.flatOptions;
  /** @internal */ protected readonly activeView = this.core.activeView;
  /** @internal */ protected readonly showRefreshIndicator = this.core.showRefreshIndicator;
  /** @internal */ protected readonly showInlineError = this.core.showInlineError;
  /** @internal */ protected readonly skeletonIndices = this.core.skeletonIndices;
  /** @internal */ protected readonly panelClassList = this.core.panelClassList;
  /** @internal */ protected readonly panelWidthCss = this.core.panelWidthCss;
  /** @internal */ readonly fallbackLabels = this.core.fallbackLabels;
  /** @internal */ readonly ariaLabels = this.core.ariaLabels;
  /** @internal */ protected readonly resolvedId = this.core.resolvedId;
  /** @internal */ protected readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  /** @internal */ protected readonly resolvedPlaceholder = this.core.resolvedPlaceholder;
  /** @internal */ protected readonly resolvedShowSelectionIndicator =
    this.core.resolvedShowSelectionIndicator;
  /** @internal */ protected readonly resolvedSelectionIndicatorVariant =
    this.core.resolvedSelectionIndicatorVariant;
  /** @internal */ protected readonly resolvedSelectionIndicatorPosition =
    this.core.resolvedSelectionIndicatorPosition;
  /** @internal */ protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */ protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly commitErrorId = this.core.commitErrorId;
  /** @internal */ protected readonly listboxId = this.core.listboxId;
  /** @internal */ protected readonly commitErrorText = this.core.commitErrorText;
  /** @internal */ protected readonly ariaReadonly = this.core.ariaReadonly;
  /** @internal */ protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */ protected readonly externalActivation = this.core.externalActivation;
  /** @internal */ protected readonly showCommitError = this.core.showCommitError;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  /**
   * Keyboard typeahead engine, family-shared via
   * `shared/typeahead-controller`. Match-to-action wiring below is
   * multi-specific (toggle).
   */
  private readonly typeaheadController = createTypeaheadController<T>({
    options: this.flatOptions,
    compareWith: this.compareWith,
    debounceMs: this.typeaheadDebounceInterval,
    disabled: this.disabled,
    locale: injectLocale(),
  });

  /**
   * Flat-nav policy via `CNGX_FLAT_NAV_STRATEGY`. Drives PageUp/Down
   * and typeahead-while-closed; variant only dispatches the action.
   */
  private readonly flatNavStrategy = inject(CNGX_FLAT_NAV_STRATEGY);

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal - latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.commitHandler.retryLast();
  });

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
  protected readonly virtualItemCount = this.virtualSetup.virtualItemCount;
  protected readonly virtualWindowStart = this.virtualSetup.virtualWindowStart;

  /**
   * Currently selected options. Structural equal on `.value` under
   * `compareWith` - fresh OptionDef references for the same values
   * don't cascade downstream re-renders.
   */
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

  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      const map = this.core.valueToOptionMap();
      if (map) {
        const out: CngxSelectOptionDef<T>[] = [];
        for (const v of vals) {
          const match = map.get(v as unknown);
          if (match) {
            out.push(match);
          }
        }
        return out;
      }
      const eq = this.compareWith();
      const out: CngxSelectOptionDef<T>[] = [];
      const flat = this.flatOptions();
      for (const v of vals) {
        const match = flat.find((o) => eq(o.value, v));
        if (match) {
          out.push(match);
        }
      }
      return out;
    },
    {
      equal: (a, b) => sameArrayContents(a, b, Object.is),
    },
  );

  /**
   * @internal - one-line summary instead of chips under the touch floor. The
   * chip strip below is its truncated-at-one derivation while it is active.
   */
  protected readonly summary = createSelectSummary<T>({
    selectedOptions: this.selectedOptions,
    active: injectTouchFloorSignal(),
    chipOverflow: this.chipOverflow,
    maxVisibleChips: this.maxVisibleChips,
    ariaLabels: this.config.ariaLabels,
    fallbackLabels: this.config.fallbackLabels,
  });
  private readonly chipStrip = this.summary.strip;
  /** @internal - chip subset + overflow badge count (see createChipOverflow). */
  protected readonly visibleSelected = this.chipStrip.visibleSelected;
  /** @internal */
  protected readonly overflowBadgeCount = this.chipStrip.overflowBadgeCount;
  /** @internal Selected options the truncated strip hides, for the overflow slot. */
  protected readonly hiddenSelected = this.chipStrip.hiddenSelected;
  /** @internal Visible `+N` badge text, the count in the reading locale's digits. */
  protected readonly overflowBadgeText = computed<string>(() =>
    this.config.fallbackLabels().chipOverflowBadge(this.overflowBadgeCount()),
  );

  private readonly togglingOption = this.core.togglingOption;

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /**
   * Toggle/clear finalize + AD-activation dispatch. Shared with
   * `CngxCombobox` / `CngxReorderableMultiSelect`; this variant adds
   * `source: this` to the change payloads.
   */
  private readonly toggleDispatch = createArrayToggleDispatch<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    commitAction: this.commitAction,
    core: this.core,
    setLastCommitted: (previous) => {
      this.lastCommittedValues = previous;
    },
    beginToggle: (next, previous, option, action) =>
      this.commitHandler.beginToggle(next, previous, option, action),
    beginClear: (previous, action) => this.commitHandler.beginClear(previous, action),
    emitOptionToggled: (option, added) => this.optionToggled.emit({ option, added }),
    emitSelectionChange: (change) => this.selectionChange.emit({ source: this, ...change }),
    emitCleared: () => this.cleared.emit(),
  });

  /**
   * Commit-flow handler. Owns commit-controller lifecycle, value
   * reconciliation, rollback-on-error, live-region announce. Shared
   * with `CngxCombobox`. Consumer emits change payloads via the
   * finalize callbacks.
   */
  private readonly commitErrorAnnouncer = inject(CngxSelectAnnouncer);
  private readonly announceCommitError = inject(CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY)({
    deps: {
      announcer: this.commitErrorAnnouncer,
      commitErrorMessage: (err) => this.core.commitErrorMessage(err),
      // Soft policy: generic removal at the CURRENT selection count - the
      // announcer's scalar-shaped count/multi args are replaced here.
      softAnnounce: (opt, action) =>
        this.core.announce(
          opt as CngxSelectOptionDef<T> | null,
          action,
          this.values().length,
          true,
        ),
    },
    policy: this.commitErrorAnnouncePolicy,
  });

  private readonly commitHandler: ArrayCommitHandler<T> = createArrayCommitHandler<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    core: this.core,
    commitAction: this.commitAction,
    getLastCommitted: () => this.lastCommittedValues,
    onToggleFinalize: (option, isNowSelected) =>
      this.toggleDispatch.finalizeToggle(option, isNowSelected, this.lastCommittedValues),
    onClearFinalize: (previous, finalValues) =>
      this.toggleDispatch.clearFinalize(previous, finalValues),
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
    announceError: (err) => this.announceCommitError(err),
  });

  /**
   * Chip-removal handler. Disabled-guard + snapshot + filter +
   * commit/sync branch dispatch + WeakMap closure cache.
   */
  private readonly chipRemovalHandler: CngxChipRemovalHandler<CngxSelectOptionDef<T>> = inject(
    CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  )<T>({
    values: this.values,
    disabled: this.disabled,
    compareWith: this.compareWith,
    commitAction: this.commitAction,
    commitMode: this.commitMode,
    beginCommit: (next, previous, item, action) =>
      this.commitHandler.beginToggle(next, previous, item, action),
    onBeforeCommit: (previous, item) => {
      this.lastCommittedValues = previous;
      this.togglingOption.set(item);
    },
    onSyncFinalize: (item, previous) => this.toggleDispatch.finalizeToggle(item, false, previous),
  });

  /** @internal */ protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */ protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */ protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */ protected readonly isCommittingOption =
    this.core.panelHostAdapter.isCommittingOption;

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  constructor() {
    this.lastCommittedValues = untracked(() => [...this.values()]);

    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Lifecycle + routing in createADActivationDispatcher; the array-shape
    // toggle/finalize closures live in createArrayToggleDispatch.
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
      restoreFocusTarget: this.triggerBtn,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
      restoringFocus: (active) => {
        this.suppressOpenOnFocus = active;
      },
    });

    createFieldSync<T[]>({
      componentValue: this.values,
      valueEquals: (a, b) => sameArrayContents(a, b, this.compareWith()),
      coerceFromField: (x) => (Array.isArray(x) ? [...(x as T[])] : []),
      toFieldValue: (v) => [...v],
    });
  }

  open(): void {
    this.popoverRef()?.show();
  }
  close(): void {
    this.hostFocus.refocusOwnerBeforeClose();
    this.popoverRef()?.hide();
  }
  toggle(): void {
    this.popoverRef()?.toggle();
  }
  focus(options?: FocusOptions): void {
    this.triggerBtn()?.nativeElement.focus(options);
  }

  /** @internal */
  protected handleTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggle();
  }

  /** @internal - click-outside dismissal (action-dirty-guarded). */
  protected readonly handleClickOutside = this.sheetWiring.handleClickOutside;

  /** @internal */
  protected handleRetry(): void {
    this.hostFocus.refocusOwnerBeforeRemoval();
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** @internal */
  protected handleChipRemoveClick(event: Event, opt: CngxSelectOptionDef<T>): void {
    event.stopPropagation();
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.chipRemovalHandler.removeByValue(opt);
  }

  /** @internal - stable per-option `remove()` closure for chip slots. */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    return this.hostFocus.withRefocus(this.chipRemovalHandler.removeFor(opt));
  }

  /** @internal */
  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAllCallback();
  }

  /** @internal - imperative clear-all used by slot + default button. */
  protected readonly clearAllCallback: () => void = this.hostFocus.withRefocus(
    this.toggleDispatch.clearAll,
  );

  /** @internal */
  // True only inside the lifecycle emitter's post-close focus restore -
  // the programmatic refocus must not re-open under openOn: 'focus'.
  private suppressOpenOnFocus = false;

  protected handleFocus(): void {
    this.focusState.markFocused();
    const openOnFocus = this.config.openOn === 'focus' || this.config.openOn === 'click+focus';
    if (openOnFocus && !this.suppressOpenOnFocus) {
      this.open();
    }
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusState.markBlurred();
  }

  /** @internal */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched - the same guard the nav strategies and CngxListboxTrigger
    // apply. Shift stays allowed.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    // Keys from a chip remove button belong to that button: no
    // preventDefault, so Enter / Space run its native activation.
    const host = event.currentTarget as Element | null;
    const target = event.target as Element | null;
    const interactive = target?.closest('button, a[href], input, [role="button"]');
    if (interactive && interactive !== host) {
      return;
    }
    const lb = this.listboxRef();
    const pop = this.popoverRef();
    // Typeahead-while-closed - toggles first matching option.
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        const action = this.flatNavStrategy.onTypeaheadWhileClosed(
          {
            options: this.flatOptions(),
            listboxItems: lb?.options() ?? [],
            currentFlatIndex: -1,
            currentListboxIndex: -1,
            compareWith: this.compareWith(),
            disabled: this.disabled(),
            typeaheadController: this.typeaheadController,
          },
          key,
        );
        if (action.kind === 'select') {
          event.preventDefault();
          this.toggleOptionByUser(action.option);
          // Multi-toggle semantics: each keystroke is an independent
          // toggle. Reset the buffer so a repeat-key toggles the same
          // option off instead of accumulating ('rr' would match
          // nothing). Single-select keeps buffering for advance-on-repeat.
          this.typeaheadController.clearBuffer();
          return;
        }
      }
    }

    handleFlatNavPageJumpKey(event, {
      listbox: lb,
      popover: pop,
      strategy: this.flatNavStrategy,
      flatOptions: this.flatOptions,
      compareWith: this.compareWith,
      disabled: this.disabled,
      typeaheadController: this.typeaheadController,
    });
  }

  private toggleOptionByUser(opt: CngxSelectOptionDef<T>): void {
    const action = this.commitAction();
    const previous = [...this.values()];
    const eq = this.compareWith();
    const wasSelected = previous.some((v) => eq(v, opt.value));
    const next = wasSelected ? previous.filter((v) => !eq(v, opt.value)) : [...previous, opt.value];
    if (action) {
      this.lastCommittedValues = previous;
      this.togglingOption.set(opt);
      if (this.commitMode() === 'optimistic') {
        this.values.set(next);
      }
      this.commitHandler.beginToggle(next, previous, opt, action);
      return;
    }
    this.values.set(next);
    this.toggleDispatch.finalizeToggle(opt, !wasSelected, previous);
  }
}
