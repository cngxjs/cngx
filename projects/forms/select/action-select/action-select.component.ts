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
  CNGX_STATEFUL,
  injectLocale,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';

import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxSearch,
  CngxListboxTrigger,
  createListboxLabelMatch,
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
import { toListboxMatchFn } from '../shared/internal/listbox-match';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFieldSkinHost,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
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
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
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
import {
  CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  type CreateCommitHandler,
} from '../shared/create-commit-handler';
import type { CngxSelectCreateAction } from '../shared/create-action.types';
import { CNGX_DISPLAY_BINDING_FACTORY, type DisplayBinding } from '../shared/display-binding';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from '../shared/panel-host';
import { resolveActionSelectConfig } from '../shared/action-select-config';
import { CNGX_SELECT_COMMIT_CONTROLLER_FACTORY } from '../shared/commit-controller.token';
import { mergeCommitState } from '../shared/internal/merged-commit-state';
import { createActionTriggerInput } from '../shared/internal/action-trigger-input';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
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
import {
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
 * Change event emitted by {@link CngxActionSelect.selectionChange}.
 * `action`: `'select'` user pick, `'clear'` reset, `'create'`
 * successful inline quick-create via `*cngxSelectAction`.
 */
export interface CngxActionSelectChange<T = unknown> {
  readonly source: CngxActionSelect<T>;
  readonly value: T | undefined;
  readonly previousValue: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'select' | 'clear' | 'create';
}

/**
 * Single-value autocomplete with inline quick-create. Mirrors
 * {@link CngxTypeahead}'s input surface; adds the `*cngxSelectAction`
 * slot - when the consumer fires its `commit()` callback the bound
 * {@link CngxSelectCreateAction} materialises a new `T` through the
 * commit controller. On success: patches the local buffer, writes
 * `value`, announces `'created'`, optionally closes.
 *
 * Pessimistic commit only: panel stays open while pending, `isPending`
 * flips on the slot context, error surfaces in the commit-error
 * banner. True optimistic create requires a consumer-supplied
 * `tempValueFactory`.
 *
 * Dismiss-guard: Escape and click-outside are intercepted while
 * `actionDirty()` is `true` (consumer flips it via `setDirty(true)`);
 * Escape fires `cancel()` to reset.
 *
 * Every slot below except `cngxSelectInputPrefix` and
 * `cngxSelectInputSuffix` (directive-only) also takes an app-wide default
 * through `CNGX_SELECT_CONFIG.templates` (`withTemplates`) via the shared
 * template registry, `cngxSelectAction` included (`templates.action`); a
 * projected template wins, `cngxSelectLoadingGlyph` included. The
 * `placeholder` input is the input's own placeholder text; there is no
 * placeholder slot.
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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/action-select/action-select.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxActionMultiSelect, CngxCombobox, CngxSelectAction
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/action-select/basic-sync-quick-create</example-url>
 * <example-url>http://localhost:4200/#/forms/select/action-select/custom-action-template-split-actions</example-url>
 * <example-url>http://localhost:4200/#/forms/select/mobile-sheet/all-variants</example-url>
 * @slot cngxSelectCheck Replaces the selection indicator on each option row unless [hideSelectionIndicator] is set; gets $implicit/option, selected, variant (radio, checkbox or checkmark), position, and indeterminate (always false here, absent on radio).
 * @slot cngxSelectCaret Replaces the trigger caret unless [hideCaret] is set; gets $implicit/open.
 * @slot cngxSelectOptgroup Replaces the header of each option group; gets $implicit/group.
 * @slot cngxSelectEmpty Replaces the panel's empty message when there are no options or none matches the typed term; gets searchTerm, filtered and totalCount (always 0 on this host).
 * @slot cngxSelectLoading Replaces the whole loading view during the first load of [state], or while [loading] is true without [state]; gets retry and progress (always undefined).
 * @slot cngxSelectLoadingGlyph Replaces the inner glyph of the spinner or bar loading view and of the refresh indicator when no cngxSelectLoading / cngxSelectRefreshing template is set; no context.
 * @slot cngxSelectOptionLabel Replaces the label text of each option row; gets $implicit/option, selected, highlighted.
 * @slot cngxSelectError Replaces the load-error block, full panel on a failed first load and inline above the options on a failed refresh; gets $implicit/error, retry.
 * @slot cngxSelectRetryButton Replaces the retry button inside the default load-error and commit-error blocks; gets $implicit/retry, error, disabled, label.
 * @slot cngxSelectRefreshing Replaces the refresh indicator shown while [state] reloads with options already listed; gets previousCount (always 0 on this host).
 * @slot cngxSelectCommitError Replaces the commit-error banner shown when a pick or create commit fails and commitErrorDisplay is 'banner'; gets $implicit/error, option, retry.
 * @slot cngxSelectClearButton Replaces the clear button, shown when [clearable] is set, a value is committed and the control is enabled; gets $implicit/clear, disabled.
 * @slot cngxSelectOptionPending Replaces the spinner on the option row whose commit is in flight; gets $implicit/option.
 * @slot cngxSelectOptionError Replaces the ! glyph on the selected row when a commit fails and commitErrorDisplay is 'inline'; gets $implicit/option, error.
 * @slot cngxSelectInputPrefix Rendered before the <input> inside the trigger; gets disabled, focused, panelOpen.
 * @slot cngxSelectInputSuffix Rendered after the <input>, before the clear button and caret; gets disabled, focused, panelOpen.
 * @slot cngxSelectAction Inline quick-create area rendered in every panel state above, below or on both sides of the options per [actionPosition] (never with 'none'), no built-in default; gets $implicit/searchTerm, commit, close, isPending, setDirty, dirty, retry, error, hasError, value.
 * @slot cngxSelectSheetHandle Replaces the decorative drag handle of the mobile sheet, inside an aria-hidden wrapper; gets $implicit/presentation, dragging.
 * @axis level organism
 */
@Component({
  selector: 'cngx-action-select',
  exportAs: 'cngxActionSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxPopoverSheet,
    CngxPopoverSheetInitialFocus,
    CngxSelectSheetHeader,
    CngxSelectSheetTrigger,
    CngxClickOutside,
    CngxListbox,
    CngxListboxSearch,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverAnchor,
    CngxPopoverTrigger,
    CngxSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CngxSelectAnnouncer, useClass: CngxScopedSelectAnnouncer },
    { provide: CNGX_SELECT_SHEET_SCOPE, useFactory: () => inject(CngxActionSelect).sheetWiring },
    {
      provide: CNGX_SELECT_SHEET_HEADER_HOST,
      useFactory: () => inject(CngxActionSelect).sheetWiring.headerHost,
    },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxActionSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxActionSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxActionSelect },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxActionSelect },
  ],
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    class: 'cngx-action-select',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '(focusin)': 'hostFocus.handleFocusIn()',
    '(focusout)': 'hostFocus.handleFocusOut($event)',
  },
  templateUrl: './action-select.component.html',
  styleUrls: ['../shared/select-base.css', './action-select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxActionSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
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
  /** Placeholder rendered inside the input while it is empty; falls back to `label` when unset. */
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
   * Accessible name of the trigger. Wins over `label`; inside a
   * `cngx-form-field` the field label referenced through `aria-labelledby`
   * takes precedence.
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
   * Formats a value into the input text. The input is rewritten through it
   * after a commit, a clear and a blur. Defaults to `String`.
   */
  readonly displayWith = input<(value: T) => string>(String);
  /**
   * Rewrites the input from the committed value when focus leaves the control,
   * dropping unfinished search text. Defaults to `true`.
   */
  readonly clearOnBlur = input<boolean>(true);
  /**
   * Per-instance match policy. Receives the option's `{ value, label }` and the
   * term and returns `true` when the option should stay visible. Wins over
   * `CngxSelectConfig.searchMatchFn`; the default is the folded label match in
   * the reading locale.
   */
  readonly searchMatchFn = input<CngxSelectMatchFn<T> | null>(null);
  /**
   * Debounce in ms between a keystroke and the search filter update and
   * `searchTermChange`. Defaults to
   * `CngxSelectConfig.typeaheadDebounceInterval`.
   */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);
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
   * Replaces the built-in clear glyph inside the default clear button while
   * keeping the button frame, ARIA and click handler. Ignored when
   * `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /** Replaces the built-in caret glyph. Ignored when `*cngxSelectCaret` is projected. */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
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
   * Async write handler run on every pick with the intended value; a clear
   * writes the value directly, without a commit. Unset, the change applies
   * directly; `commitMode` decides how it shows while the handler runs. Creates
   * run through `quickCreateAction` instead.
   */
  readonly commitAction = input<CngxSelectCommitAction<T> | null>(null);
  /**
   * Value write while `commitAction` runs. `'optimistic'` (default) shows the
   * picked value at once and rolls back on error; `'pessimistic'` waits for the
   * commit to succeed. The panel closes on pick in both modes.
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
   * Commit-error announce policy. `'verbose'` reads the error message into the
   * live region; `'soft'` announces a generic removal without a count.
   * Per-instance input wins over `CngxSelectConfig.commitErrorAnnouncePolicy`;
   * default `{ kind: 'soft' }`, so a failed commit does not interrupt typing.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'soft' },
  );
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
   * Quick-create handler run by the action slot's `commit()` with the live
   * search term and the draft `{ label }`; it resolves to the new value. `null`
   * disables creation and `commit()` becomes a no-op.
   */
  readonly quickCreateAction = input<CngxSelectCreateAction<T> | null>(null);
  /**
   * Whether a successful create closes the panel. Default `true`.
   * Set `false` for confirmation / multi-step wizard flows.
   */
  readonly closeOnCreate = input<boolean>(this.actionConfig.closeOnCreate ?? true);
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
   * Mobile `enterkeyhint`. Default `'go'` - Enter routes to
   * quick-create when no AD item is active.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'go',
  );

  /**
   * Selected value, two-way bindable as `[(value)]`. Syncs with the bound field
   * inside a `cngx-form-field`.
   */
  readonly value = model<T | undefined>(undefined);

  /**
   * Emits after a pick, clear or create settles, with the new and previous
   * value, the option and the action. With `commitAction` bound a pick fires on
   * commit success.
   */
  readonly selectionChange = output<CngxActionSelectChange<T>>();
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
   * Emits the error when `commitAction` fails. The live region reads a soft
   * removal by default; `commitErrorAnnouncePolicy` switches to the error
   * message.
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
  private readonly optionLabelDirective =
    contentChild<CngxSelectOptionLabel<T>>(CngxSelectOptionLabel);
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDirective =
    contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
  private readonly refreshingDirective = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective =
    contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
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

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);
  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal Field-facing focus and touched: focus inside the host, panel included. */
  protected readonly hostFocus = createHostFocusWithin({
    onLeave: () => this.presenter?.fieldState().markAsTouched(),
    // Closure: the sheet wiring is declared further down in field order.
    close: () => this.sheetWiring.handleFocusLeave(),
    owner: () => this.inputEl()?.nativeElement,
    restoreFocus: this.config.restoreFocus,
    suppressOpenOnFocus: (active) => this.sheetWiring.handleTriggerRefocus(active),
  });
  /** @internal */ readonly focused = this.hostFocus.focusedWithin;
  readonly empty = computed<boolean>(() => this.value() === undefined);

  /** @internal Folded substring match of the option label in the reading locale. */
  private readonly labelMatch = createListboxLabelMatch(injectLocale());

  /** @internal */
  protected readonly effectiveMatchFn = computed<CngxSelectMatchFn<T>>(
    () => this.searchMatchFn() ?? this.config.searchMatchFn ?? this.labelMatch,
  );

  /** @internal - `effectiveMatchFn` as the listbox search input takes it. */
  protected readonly listboxMatchFn = computed(() => toListboxMatchFn(this.effectiveMatchFn()));

  /** Filter overlay applied by `createSelectCore` on non-empty search term. */
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
   * Action-slot bridge. `isPending` mirrors the commit controller so
   * the slot's `isPending` context flag drives button spinner / disabled
   * state from the same machine as the commit-error banner.
   *
   * `commit` and `retry` close over `this` and resolve `createHandler`
   * at call time - the handler is declared lower in field-init order.
   *
   * @internal
   */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
    commit: (draft) => this.handleActionCommit(draft),
    retry: () => this.createHandler.retryLast(),
    isPending: computed(() => this.createCommitController.isCommitting()),
  });
  /** @internal */
  readonly actionDirty = this.actionBridge.dirty;
  /** @internal */
  readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */
  readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;
  /**
   * Live search term forwarded to `*cngxSelectAction`'s `$implicit` +
   * `searchTerm` slot fields so `let-term` reflects user typing.
   *
   * @internal
   */
  readonly actionSearchTerm = this.searchTerm;
  /**
   * Action context's `error` + `hasError` source. Reflects create
   * failures only - select errors flow through the shell's commit-error
   * banner via `core.commitController`. Parity with
   * `CngxActionMultiSelect`.
   *
   * @internal
   */
  readonly actionError = computed<unknown>(() => this.createCommitController.state.error());
  /**
   * Action context's `value` source. Forwards the live scalar selection
   * so in-panel mini-forms can read it without re-injecting.
   *
   * @internal
   */
  readonly actionValue = computed<unknown>(() => this.value());

  private readonly core: CngxSelectCore<T, T> = createSelectCore<T, T>(
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
      filter: this.filter,
      multi: computed(() => false),
      currentSelection: this.value,
      selectionIndicatorPosition: this.selectionIndicatorPosition,
      selectionIndicatorVariant: this.selectionIndicatorVariant,
      localItems: this.localItemsBuffer.items,
      presentationInput: this.presentation,
      // Lazy: the wiring is built from the core right below.
      presentation: computed<CngxPopoverPresentation>(() => this.sheetWiring.presentation()),
      // Lazy: the create controller is built below the core.
      createErrorMessage: computed<string | null>(() => this.createErrorMessage()),
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
   * Append a pre-built option to the local buffer. Used internally by
   * the create-commit handler; exposed for consumer pre-seed (recent-
   * items, history workflows).
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

  /** @internal */
  protected readonly effectiveOptions = this.core.effectiveOptions;
  /** @internal */
  protected readonly flatOptions = this.core.flatOptions;
  /** @internal */
  protected readonly activeView = this.core.activeView;
  /** @internal */
  protected readonly showRefreshIndicator = this.core.showRefreshIndicator;
  /** @internal */
  protected readonly showInlineError = this.core.showInlineError;
  /** @internal */
  protected readonly skeletonIndices = this.core.skeletonIndices;
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
  protected readonly resolvedPlaceholder = this.core.resolvedPlaceholder;
  /** @internal */
  protected readonly resolvedShowSelectionIndicator = this.core.resolvedShowSelectionIndicator;
  /** @internal */
  protected readonly resolvedSelectionIndicatorVariant =
    this.core.resolvedSelectionIndicatorVariant;
  /** @internal */
  protected readonly resolvedSelectionIndicatorPosition =
    this.core.resolvedSelectionIndicatorPosition;
  /** @internal */
  protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */
  protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly commitErrorId = this.core.commitErrorId;
  /** @internal */ protected readonly listboxId = this.core.listboxId;
  /** @internal */ protected readonly commitErrorText = this.core.commitErrorText;
  /** @internal */
  protected readonly ariaReadonly = this.core.ariaReadonly;
  /** @internal */
  protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */
  protected readonly externalActivation = this.core.externalActivation;
  /** @internal */
  protected readonly showCommitError = this.core.showCommitError;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  /** @internal */
  protected readonly inputSlotContext = computed<CngxSelectInputSlotContext>(
    () => ({ disabled: this.disabled(), focused: this.focusState.focused(), panelOpen: this.panelOpen() }),
    {
      equal: (a, b) =>
        a.disabled === b.disabled && a.focused === b.focused && a.panelOpen === b.panelOpen,
    },
  );

  /**
   * Dedicated commit controller for quick-create, mirroring
   * `CngxActionMultiSelect`. The select path runs through
   * `core.commitController`; sharing it meant `begin()` superseded an
   * in-flight create whenever an option was activated (and vice versa).
   * Splitting preserves independent supersede semantics per machine.
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

  /**
   * Select surface with the quick-create machine overlaid: create
   * pending/error win while active, so `CNGX_STATEFUL` consumers see a
   * quick-create in flight - parity with `CngxActionMultiSelect`.
   */
  readonly commitState = mergeCommitState(this.core.commitState, this.createCommitController.state);
  /** `true` while either the select or the quick-create commit is pending. */
  readonly isCommitting = computed<boolean>(
    () => this.core.isCommitting() || this.createCommitController.isCommitting(),
  );
  /** @internal */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.scalarHandler.retryLast();
  });

  /** @internal - full virtualisation wire-up (see setupVirtualization). */
  private readonly virtualSetup = setupVirtualization<T, T>({
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

  readonly selected = computed<CngxSelectOptionDef<T> | null>(
    () => {
      const v = this.value();
      if (v === undefined || v === null) {
        return null;
      }
      const map = this.core.valueToOptionMap();
      if (map) {
        return map.get(v as unknown) ?? null;
      }
      const eq = this.compareWith();
      return this.core.unfilteredFlatOptions().find((o) => eq(o.value, v)) ?? null;
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a === null || b === null) {
          return false;
        }
        return (this.compareWith() as CngxSelectCompareFn<unknown>)(a.value, b.value);
      },
    },
  );

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  private readonly announcer = inject(CngxSelectAnnouncer);
  /** A rejected quick-create is spoken assertively, whatever the select's own policy. */
  private readonly announceCreateError = inject(CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY)({
    deps: {
      announcer: this.announcer,
      commitErrorMessage: (err) => this.core.createFailedMessage(this.lastCreateLabel(), err),
      softAnnounce: (opt, action, count, multi) =>
        this.core.announce(opt as CngxSelectOptionDef<T> | null, action, count, multi),
    },
    policy: signal<CngxCommitErrorAnnouncePolicy>({ kind: 'verbose', severity: 'assertive' }),
  });
  private readonly announceCommitError = inject(CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY)({
    deps: {
      announcer: this.announcer,
      commitErrorMessage: (err) => this.core.commitErrorMessage(err),
      softAnnounce: (opt, action, count, multi) =>
        this.core.announce(opt as CngxSelectOptionDef<T> | null, action, count, multi),
    },
    policy: this.commitErrorAnnouncePolicy,
  });
  private readonly display: DisplayBinding<T> = inject(CNGX_DISPLAY_BINDING_FACTORY)<T>({
    value: this.value,
    displayWith: this.displayWith,
    focused: this.focusState.focused,
    inputEl: this.inputEl,
    searchRef: this.searchInputRef,
    searchTerm: this.searchTerm,
    skipInitial: this.skipInitial,
    onUserSearchTerm: (term) => this.searchTermChange.emit(term),
  });

  private readonly createHandler: CreateCommitHandler<T, T | undefined> = inject(
    CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  )<T, T | undefined>({
    quickCreateAction: this.quickCreateAction,
    commitController: this.createCommitController,
    localItemsBuffer: this.localItemsBuffer,
    closeOnSuccess: this.closeOnCreate,
    onCreated: (option, previousValue) => {
      // Single-value semantic: write value, mirror into display, emit 'create'.
      this.value.set(option.value);
      this.display.writeFromValue(option.value);
      this.selectionChange.emit({
        source: this,
        value: option.value,
        previousValue,
        option,
        action: 'create',
      });
      this.created.emit(option);
    },
    onAnnounce: (option) => {
      this.core.announce(option, 'created', 1, false);
    },
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => {
      this.announceCreateError(err);
      this.commitError.emit(err);
    },
    onClose: () => this.close(),
    onResetDirty: () => this.actionBridge.reset(),
  });

  /** @internal */
  protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */
  protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */
  protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */
  protected readonly isCommittingOption = this.core.panelHostAdapter.isCommittingOption;

  protected isEmpty(): boolean {
    return this.value() === undefined;
  }

  constructor() {
    // Same teardown as the core's select controller: a create that settles
    // after the host is destroyed is dropped.
    inject(DestroyRef).onDestroy(() => this.createCommitController.cancel());
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
      this.display.writeFromValue(this.value());
    });

    createADActivationDispatcher<T, T>({
      beforeHide: () => this.hostFocus.refocusOwnerBeforeClose(),
      listboxRef: this.listboxRef,
      core: this.core,
      popoverRef: this.popoverRef,
      closeOnSelect: true,
      commitAction: this.commitAction,
      onCommit: (intended, opt) => this.scalarHandler.dispatchFromActivation(intended, opt),
      onActivate: (intended, opt) => {
        const previous = untracked(() => this.value());
        this.scalarHandler.finalizeSelection(intended, opt, previous);
      },
    });

    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.inputEl,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
      restoringFocus: (active) => this.sheetWiring.handleTriggerRefocus(active),
    });

    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) => (this.compareWith() as CngxSelectCompareFn<unknown>)(a, b),
      coerceFromField: (x) => x as T | undefined,
    });

    // Auto-open on typing. Same gating as CngxTypeahead - display-binding
    // owns the searchTermChange emit via onUserSearchTerm, so emit is undefined.
    inject(CNGX_SEARCH_EFFECTS_FACTORY)({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      focused: this.focusState.focused,
      open: () => this.open(),
      autoOpenGate: () => !this.display.isWritingFromValue(),
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

  /**
   * Trigger-input keyboard + live-term dispatch. Shared with
   * `CngxActionMultiSelect`; this variant snapshots the scalar `value`.
   */
  private readonly triggerInput = createActionTriggerInput<T | undefined>({
    listbox: this.listboxRef,
    popover: this.popoverRef,
    flatOptions: () => this.core.flatOptions(),
    input: this.inputEl,
    searchTerm: this.searchTerm,
    liveInputFallback: this.liveInputFallback,
    hasQuickCreateAction: () => this.quickCreateAction() !== null,
    snapshotPrevious: () => this.value(),
    dispatch: (draft, term, previous) => {
      this.lastCreateLabel.set(draft.label);
      this.createHandler.dispatch(draft, term, previous);
    },
  });

  /** @internal - Enter-to-quick-create (see createActionTriggerInput). */
  protected readonly handleTriggerEnter = this.triggerInput.handleTriggerEnter;
  /** @internal - PageUp/PageDown shared behaviour (±10 option jump). */
  protected readonly handleInputKeydown = this.triggerInput.handleInputKeydown;
  private readonly handleActionCommit = this.triggerInput.handleActionCommit;

  protected handleWrapperClick(): void {
    if (this.disabled()) {
      return;
    }
    this.focus();
    if (!this.panelOpen()) {
      this.open();
    }
  }

  /** @internal - click-outside dismissal (action-dirty-guarded). */
  protected readonly handleClickOutside = this.sheetWiring.handleClickOutside;

  protected handleRetry(): void {
    this.hostFocus.refocusOwnerBeforeRemoval();
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  protected handleClearClick(event: Event): void {
    event.stopPropagation();
    this.clearCallback();
  }

  /** @internal */
  protected readonly clearCallback: () => void = () => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    const current = this.value();
    if (current === undefined) {
      return;
    }
    this.value.set(undefined);
    this.display.writeFromValue(undefined);
    this.cleared.emit();
    this.selectionChange.emit({
      source: this,
      value: undefined,
      previousValue: current,
      option: null,
      action: 'clear',
    });
    this.core.announce(null, 'removed', 0, false);
  };

  protected handleFocus(): void {
    this.focusState.markFocused();
  }

  protected handleBlur(event?: FocusEvent): void {
    this.focusState.markBlurred();
    if (!this.clearOnBlur()) {
      return;
    }
    // Skip clear-on-blur when focus moves INSIDE the component (action-
    // slot button, clear button). Otherwise blur races the click: blur
    // fires first, writes `displayWith(value)` (or empty), and by the
    // time the click runs the raw input is gone - `commit()` silently
    // drops because the draft label is empty.
    const related = event?.relatedTarget as HTMLElement | null;
    if (related && this.isWithinComponent(related)) {
      return;
    }
    this.display.writeFromValue(this.value());
  }

  /**
   * Whether `el` is a descendant of the host. Includes the popover
   * panel + action-slot - `<div cngxPopover>` lives in the host
   * template even when rendered in the top-layer, and `contains`
   * follows the DOM tree, not the rendering tree.
   *
   * Uses the injected `ElementRef` rather than `closest()` against a
   * hardcoded class so re-skinning doesn't break the blur-guard.
   *
   * @internal
   */
  private isWithinComponent(el: HTMLElement): boolean {
    return this.hostEl.nativeElement.contains(el);
  }

  /**
   * Scalar commit handler. Variant callbacks:
   *
   *   - `onCommitFinalize` emits `selectionChange({ action: 'select' })`
   *     and announces `'added'`.
   *   - `onCommitError` delegates to the announcer (soft policy).
   *   - `onValueWrite` mirrors the committed value into the input via
   *     the display binding.
   *
   * @internal
   */
  private readonly scalarHandler: ScalarCommitHandler<T> = inject(
    CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  )<T>({
    value: this.value,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    core: this.core,
    commitAction: this.commitAction,
    onCommitFinalize: (option, finalValue, previousValue) => {
      this.createErrorCleared.set(true);
      this.selectionChange.emit({
        source: this,
        value: finalValue,
        previousValue,
        option,
        action: 'select',
      });
      this.core.announce(option, 'added', option ? 1 : 0, false);
    },
    onCommitError: (err) => this.announceCommitError(err),
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
    onValueWrite: (v) => this.display.writeFromValue(v),
  });
}
