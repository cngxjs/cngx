import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  inject,
  input,
  model,
  output,
  untracked,
  ElementRef,
  type Signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';

import {
  CNGX_STATEFUL,
  injectLocale,
  nextUid,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';
import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
  createListboxLabelMatch,
  CNGX_OPTION_CONTAINER,
  CNGX_OPTION_FILTER_HOST,
  CNGX_OPTION_INTERACTION_HOST,
  CNGX_OPTION_STATUS_HOST,
  type CngxOption,
  type CngxOptionFilterHost,
  type CngxOptionInteractionHost,
  type CngxOptionStatus,
  type CngxOptionStatusHost,
} from '@cngx/common/interactive';
import { CngxIconSvg } from '@cngx/common/display';
import {
  CngxPopover,
  CngxPopoverSheet,
  CngxPopoverSheetInitialFocus,
  CngxPopoverTrigger,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationRequest,
  type PopoverPlacement,
} from '@cngx/common/popover';

import { cngxDevWarn, CNGX_ICON_CARET_DOWN, CNGX_ICON_X } from '@cngx/utils';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFieldSkinHost,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { injectSelectCopy } from '../i18n/select-i18n';
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
import { CNGX_FLAT_NAV_STRATEGY } from '../shared/flat-nav-strategy';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectMatchFn,
  type CngxSelectMatchOption,
  type CngxSelectRefreshingVariant,
  type CngxSelectSelectionIndicatorVariant,
} from '../shared/config';
import {
  type CngxSelectCommitAction,
  type CngxSelectCommitErrorDisplay,
  type CngxSelectCommitMode,
} from '../shared/commit-action.types';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import { type CngxSelectOptionDef, type CngxSelectOptionsInput } from '../shared/option.model';
import { CNGX_PROJECTED_OPTION_MODEL_FACTORY } from '../shared/projected-option-model';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from '../shared/panel-host';
import { CngxSelectPanelShell } from '../shared/internal/panel-shell/panel-shell.component';
import {
  CNGX_SELECT_SHELL_SEARCH_HOST,
  type CngxSelectShellSearchHost,
} from '../declarative/select-search-host';
import { CngxSelectSearch } from '../declarative/select-search.component';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { resolvePageJumpSpace } from '../shared/internal/page-jump-handler';
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
  type CngxSelectCore,
} from '../shared/internal/select-core';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import { createTypeaheadController } from '../shared/typeahead-controller';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { injectResolvedTemplate } from '../shared/internal/resolve-template';
import {
  CngxSelectCaret,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectLoadingGlyph,
  CngxSelectOptionError,
  CngxSelectSheetHandle,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  CngxSelectRetryButton,
  CngxSelectTriggerLabel,
  type CngxSelectCaretContext,
  type CngxSelectClearButtonContext,
  type CngxSelectTriggerLabelContext,
} from '../shared/template-slots';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import { createHostFocusWithin } from '../shared/internal/host-focus-within';

/**
 * Change event emitted by {@link CngxSelectShell.selectionChange} on
 * a user pick.
 */
export interface CngxSelectShellChange<T = unknown> {
  readonly source: CngxSelectShell<T>;
  readonly value: T | undefined;
  readonly previousValue?: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Native-feeling single-value dropdown with **declarative options** -
 * consumers project `<cngx-option>` / `<cngx-optgroup>` children and
 * the shell derives a hierarchy-aware option model.
 *
 * Bridges the raw-listbox compose-yourself path and the data-mode
 * `<cngx-select [options]>` path: same family-level intelligence
 * (reactive trigger ARIA, panel composition, template-slot cascade)
 * applied to a content-projected option list.
 *
 * Naming: distinct from the internal `CngxSelectPanelShell` -
 * `Shell` here is the *projection-shell* that wraps consumer option
 * markup.
 *
 * Option rows and group headers are the projected `<cngx-option>` /
 * `<cngx-optgroup>` markup itself; the option-loop slots
 * `cngxSelectCheck`, `cngxSelectOptgroup` and `cngxSelectOptionLabel` do
 * not exist on this host.
 *
 * Every slot below also takes an app-wide default through
 * `CNGX_SELECT_CONFIG.templates` (`withTemplates`); a projected template
 * wins. That includes `cngxSelectLoadingGlyph`, resolved from the directive
 * first and `templates.loadingGlyph` second, and `cngxSelectTriggerLabel`,
 * resolved the same way from `templates.triggerLabel`.
 *
 * **Mobile sheet.** On a coarse screen narrower than 48rem the panel opens as
 * a modal bottom sheet, or fullscreen when a `<cngx-select-search>` leads the
 * panel: a `role="dialog"` named by the field label, with a close button and
 * a decorative handle (`*cngxSelectSheetHandle`). Focus moves into the sheet
 * on open and back to the trigger on close, the rest of the page is inert,
 * and announcements are spoken from inside the sheet. `[presentation]` forces
 * `'anchored'`, `'sheet'` or `'fullscreen'`; `withMobileSheet('off')` keeps
 * every select in its scope anchored.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/select-shell/select-shell.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider, CngxSelectSearch
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>/#/forms/select/select-shell/basic-flat-declarative-options</example-url>
 * <example-url>/#/forms/select/select-shell/custom-glyphs-clearglyph-caretglyph</example-url>
 * <example-url>/#/forms/select/select-shell/grouped-divider-projected-hierarchy</example-url>
 * <example-url>/#/forms/select/select-shell/inside-cngx-form-field-reactive-forms</example-url>
 * <example-url>/#/forms/select/select-shell/rich-content-option-plain-text-trigger</example-url>
 * <example-url>/#/forms/select/select-shell/search-declarative-cngx-select-search</example-url>
 * <example-url>/#/forms/select/mobile-sheet/all-variants</example-url>
 * @slot cngxSelectCaret Replaces the trigger caret (inside an aria-hidden span) unless [hideCaret] is set; gets $implicit/open.
 * @slot cngxSelectPlaceholder Replaces the trigger text while nothing is selected and wins over cngxSelectTriggerLabel there; gets $implicit/placeholder.
 * @slot cngxSelectEmpty Replaces the panel's empty message when no option is projected or [state] resolves empty (a search only hides projected options, it never shows this); gets searchTerm, filtered, totalCount.
 * @slot cngxSelectLoading Replaces the whole loading view during the first load of [state], or while [loading] is true without [state]; gets retry and progress (always undefined).
 * @slot cngxSelectLoadingGlyph Replaces the inner glyph of the spinner or bar loading view and of the refresh indicator when no cngxSelectLoading / cngxSelectRefreshing template is set; no context.
 * @slot cngxSelectTriggerLabel Replaces the trigger text once a value is selected, and while empty when no placeholder template is set (selected is then null); gets $implicit/selected, disabled, panelOpen, focused.
 * @slot cngxSelectError Replaces the load-error block, full panel on a failed first load and inline above the options on a failed refresh; gets $implicit/error, retry.
 * @slot cngxSelectRetryButton Replaces the retry button inside the default load-error and commit-error blocks; gets $implicit/retry, error, disabled, label.
 * @slot cngxSelectRefreshing Replaces the refresh indicator shown while [state] reloads with options already listed; gets previousCount.
 * @slot cngxSelectCommitError Replaces the commit-error banner shown when a commit fails and commitErrorDisplay is 'banner'; gets $implicit/error, option, retry.
 * @slot cngxSelectClearButton Replaces the clear button, shown when [clearable] is set, a value is selected and the control is enabled; gets $implicit/clear, disabled.
 * @slot cngxSelectOptionPending Rendered inside the projected <cngx-option> whose commit is in flight, with no built-in fallback; gets no context.
 * @slot cngxSelectOptionError Rendered inside the projected <cngx-option> whose commit failed, regardless of commitErrorDisplay, with no built-in fallback; gets no context.
 * @slot cngxSelectSheetHandle Replaces the decorative drag handle of the mobile sheet, inside an aria-hidden wrapper; gets $implicit/presentation, dragging.
 * @axis level organism
 */
@Component({
  selector: 'cngx-select-shell',
  exportAs: 'cngxSelectShell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxIconSvg,
    CngxPopoverSheet,
    CngxPopoverSheetInitialFocus,
    CngxSelectSheetTrigger,
    CngxSelectSheetHeader,
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanelShell,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CngxSelectAnnouncer, useClass: CngxScopedSelectAnnouncer },
    { provide: CNGX_SELECT_SHEET_SCOPE, useFactory: () => inject(CngxSelectShell).sheetWiring },
    {
      provide: CNGX_SELECT_SHEET_HEADER_HOST,
      useFactory: () => inject(CngxSelectShell).sheetWiring.headerHost,
    },
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelectShell },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxSelectShell);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxSelectShell },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxSelectShell },
    { provide: CNGX_OPTION_STATUS_HOST, useExisting: CngxSelectShell },
    { provide: CNGX_OPTION_FILTER_HOST, useExisting: CngxSelectShell },
    { provide: CNGX_OPTION_INTERACTION_HOST, useExisting: CngxSelectShell },
    {
      provide: CNGX_SELECT_SHELL_SEARCH_HOST,
      useFactory: (): CngxSelectShellSearchHost => {
        const self = inject(CngxSelectShell);
        return {
          searchTerm: self.searchTerm,
          listboxRef: self.listboxRef,
          // Escape in the search: the sheet gate while modal, today's close
          // while anchored. The trigger is inert under a modal sheet, so the
          // refocus is left to the close path.
          close: () => self.sheetWiring.escapeClose(),
          focus: () => {
            if (!self.sheetWiring.sheetModal()) {
              self.focus();
            }
          },
          registerInitialFocus: (element) => self.registerSheetInitialFocus(element),
        };
      },
    },
  ],
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    class: 'cngx-select-shell',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '(focusin)': 'hostFocus.handleFocusIn()',
    '(focusout)': 'hostFocus.handleFocusOut($event)',
  },
  templateUrl: './select-shell.component.html',
  styleUrls: ['../shared/select-base.css', './select-shell.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxSelectShell<T = unknown>
  implements
    CngxFormFieldControl,
    CngxOptionStatusHost,
    CngxOptionFilterHost,
    CngxOptionInteractionHost,
    CngxSelectShellSearchHost
{
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly config = resolveSelectConfig();

  /**
   * Field label. Names the trigger when neither `aria-label` nor
   * `aria-labelledby` is set, names the listbox, and stands in for an empty
   * `placeholder`.
   */
  readonly label = input<string>('');
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
   * Popover placement relative to the trigger. Per-instance input wins over
   * `CngxSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
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
  protected readonly caretIcon = CNGX_ICON_CARET_DOWN;
  protected readonly clearIcon = CNGX_ICON_X;
  /** @internal Bound value, else the config copy; follows a language switch. */
  protected readonly resolvedClearButtonAriaLabel = computed<string>(
    () =>
      this.clearButtonAriaLabel() ??
      this.config.ariaLabels().clearButton ??
      this.selectCopy().clearSelection,
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
   * Async-state source for the options. When bound, its data replaces the
   * projected options and its status drives the loading, empty, error and
   * refreshing views.
   */
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);
  /** Callback the built-in retry button runs after a failed load, before `retry` emits. */
  readonly retryFn = input<(() => void) | null>(null);
  /**
   * Async write handler run on every pick with the intended value; a clear
   * writes the value directly, without a commit. Unset, the change applies
   * directly; `commitMode` decides how it shows while the handler runs.
   */
  readonly commitAction = input<CngxSelectCommitAction<T> | null>(null);
  /**
   * Panel behaviour while `commitAction` runs. `'optimistic'` (default) closes
   * the panel when the commit starts and rolls back on error; `'pessimistic'`
   * keeps it open with a row spinner and closes it on success.
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
   * live region; `'soft'` announces a generic removal without a count.
   * Per-instance input wins over `CngxSelectConfig.commitErrorAnnouncePolicy`;
   * default `{ kind: 'verbose', severity: 'assertive' }`.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );

  /**
   * Selected value, two-way bindable as `[(value)]`. Syncs with the bound field
   * inside a `cngx-form-field`.
   */
  readonly value = model<T | undefined>(undefined);

  /**
   * Two-way bindable search term. Drives per-option visibility through
   * `CngxOptionFilterHost` and filters the listbox AD so keyboard nav
   * skips hidden options. Empty string disables the filter.
   *
   * The model's own `searchTermChange` output fires on every change of the
   * term. The seed `''` never emits: a model only emits when its value
   * changes, so server-driven autocomplete consumers don't fire a blank
   * search at hydrate time.
   */
  readonly searchTerm = model<string>('');

  /**
   * Per-instance match policy. Receives the option's `{ value, label }` and the
   * term and returns `true` when the option should stay visible. Wins over
   * `CngxSelectConfig.searchMatchFn`; the default is the folded label match in
   * the reading locale.
   */
  readonly searchMatchFn = input<CngxSelectMatchFn<T> | null>(null);

  /**
   * Debounce for the search pipeline (ms). Forward-compatible input -
   * the shipped `CNGX_SEARCH_EFFECTS_FACTORY` acts immediately;
   * consumers overriding the factory read this signal to size their
   * pipeline.
   */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);

  /**
   * Emits after a pick or clear settles, with the new value, the previous value
   * and the picked option; the shell has no `optionSelected` output. With
   * `commitAction` bound it fires on commit success, not on the pick.
   */
  readonly selectionChange = output<CngxSelectShellChange<T>>();
  /** Emits `true` when the panel opens and `false` when it closes. */
  readonly openedChange = output<boolean>();
  /** Emits when the panel opens. */
  readonly opened = output<void>();
  /** Emits when the panel closes. */
  readonly closed = output<void>();
  /**
   * Emits when the built-in retry button is pressed after a failed load, after
   * `retryFn` has run.
   */
  readonly retry = output<void>();
  /**
   * Emits the error when `commitAction` fails. The error is also announced
   * assertively by default; `commitErrorAnnouncePolicy` changes that.
   */
  readonly commitError = output<unknown>();
  /** Emits each status of a `commitAction` run: `'pending'`, then `'success'` or `'error'`. */
  readonly stateChange = output<AsyncStatus>();

  /**
   * Direct top-level entries projected by the consumer:
   * `<cngx-option>` leaves and `<cngx-optgroup>` parents in DOM order.
   *
   * @internal
   */
  private readonly containers = contentChildren(CNGX_OPTION_CONTAINER, {
    descendants: false,
  });

  /**
   * Projected option model. Derives `derivedOptions` (option-loop
   * input), `projectedOptions` (flat directive list for
   * `cngxListbox.[explicitOptions]`), `visibleProjectedOptions`
   * (filtered), `adItems` (AD-shape) from projected children.
   *
   * Resolved via `CNGX_PROJECTED_OPTION_MODEL_FACTORY` - override for
   * custom value/label/disabled extraction (data-* attrs, async
   * labels) without forking.
   *
   * @internal
   */
  private readonly projectedOptionModel = inject(CNGX_PROJECTED_OPTION_MODEL_FACTORY)<T>({
    containers: this.containers,
    searchTerm: this.searchTerm,
    matches: (option, term) => this.matchOption(option, term),
  });

  protected readonly derivedOptions = this.projectedOptionModel.derivedOptions;
  protected readonly projectedOptions = this.projectedOptionModel.projectedOptions;
  protected readonly visibleProjectedOptions = this.projectedOptionModel.visibleProjectedOptions;
  protected readonly adItems = this.projectedOptionModel.adItems;

  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly loadingGlyphDirective =
    contentChild<CngxSelectLoadingGlyph>(CngxSelectLoadingGlyph);
  private readonly triggerLabelDirective =
    contentChild<CngxSelectTriggerLabel<T>>(CngxSelectTriggerLabel);
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
  private readonly searchChild = contentChild(CngxSelectSearch);

  protected readonly tpl = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    caret: this.caretDirective,
    placeholder: this.placeholderDirective,
    empty: this.emptyDirective,
    loading: this.loadingDirective,
    loadingGlyph: this.loadingGlyphDirective,
    error: this.errorDirective,
    retryButton: this.retryButtonDirective,
    refreshing: this.refreshingDirective,
    commitError: this.commitErrorDirective,
    clearButton: this.clearButtonDirective,
    optionPending: this.optionPendingDirective,
    optionError: this.optionErrorDirective,
    sheetHandle: this.sheetHandleDirective,
  });

  /**
   * Trigger-label slot: projected `*cngxSelectTriggerLabel` first, then
   * `templates.triggerLabel`. Outside the shared registry because the
   * directive's typed context shape varies per variant.
   */
  protected readonly triggerLabelTpl = injectResolvedTemplate(
    this.triggerLabelDirective,
    'triggerLabel',
  );

  /**
   * Trigger-label slot context. Structural equal suppresses
   * `ngTemplateOutlet` rebinds when unrelated inputs change.
   *
   * @internal
   */
  protected readonly triggerLabelContext = computed<CngxSelectTriggerLabelContext<T>>(
    () => {
      const sel = this.selectedOption();
      return {
        $implicit: sel,
        selected: sel,
        disabled: this.disabled(),
        panelOpen: this.panelOpen(),
        focused: this.focusState.focused(),
      };
    },
    {
      equal: (a, b) =>
        a.$implicit === b.$implicit &&
        a.selected === b.selected &&
        a.disabled === b.disabled &&
        a.panelOpen === b.panelOpen &&
        a.focused === b.focused,
    },
  );

  /**
   * Caret slot context. `open` flips with the popover; `$implicit` is
   * the same value.
   *
   * @internal
   */
  protected readonly caretContext = computed<CngxSelectCaretContext>(
    () => ({ $implicit: this.panelOpen(), open: this.panelOpen() }),
    { equal: (a, b) => a.open === b.open },
  );

  /**
   * Clear-button slot context. `$implicit === clear` so templates can
   * capture either name. The closure reference is stable across
   * re-emits.
   *
   * @internal
   */
  protected readonly clearButtonContext = computed<CngxSelectClearButtonContext>(
    () => ({
      $implicit: this.handleClearAction,
      clear: this.handleClearAction,
      disabled: this.disabled(),
    }),
    { equal: (a, b) => a.disabled === b.disabled },
  );

  /**
   * Stable clear closure for the slot context. Same path as
   * `handleClearClick` minus the event payload - projected templates
   * own their pointer-event semantics.
   *
   * @internal
   */
  private readonly handleClearAction = (): void => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    const current = this.value();
    if (current === undefined || current === null) {
      return;
    }
    this.value.set(undefined);
    this.selectionChange.emit({
      source: this,
      value: undefined,
      previousValue: current,
      option: null,
    });
    this.core.announce(null, 'removed', 0, false);
  };

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  /** @internal - exposed to satisfy `CngxSelectShellSearchHost` so the
   *  projected `<cngx-select-search>` can forward keyboard nav into the
   *  listbox AD without ancestor injection. */
  readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);
  private readonly sheetRef = viewChild(CngxPopoverSheet);
  private readonly listboxEl = viewChild<CngxListbox, ElementRef<HTMLElement>>(CngxListbox, {
    read: ElementRef,
  });

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

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
  readonly focused = this.hostFocus.focusedWithin;

  readonly empty = computed<boolean>(() => {
    const v = this.value();
    return v === undefined || v === null;
  });

  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // Kept for panel-host parity; the shell's projected DOM is the source of truth.
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(this.compareWith);

  /**
   * Family-shared signal graph. `commitAction` is wired so
   * `externalActivation` flips automatically when a consumer binds it.
   */
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
      options: this.derivedOptions,
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
      multi: computed(() => false),
      currentSelection: this.value,
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
    showDone: false,
    showInput: false,
    sheetLabel: this.sheetLabel,
    label: this.label,
    close: () => this.close(),
  });
  /**
   * @internal Static height fact: fullscreen when a `<cngx-select-search>` leads
   * the panel, else a content-sized sheet.
   */
  protected readonly sheetFill = computed<'sheet' | 'fullscreen'>(() =>
    this.searchChild() ? 'fullscreen' : 'sheet',
  );

  protected readonly effectiveOptions = this.core.effectiveOptions;
  protected readonly flatOptions = this.core.flatOptions;
  protected readonly activeView = this.core.activeView;
  protected readonly showRefreshIndicator = this.core.showRefreshIndicator;
  protected readonly showInlineError = this.core.showInlineError;
  protected readonly skeletonIndices = this.core.skeletonIndices;
  protected readonly panelClassList = this.core.panelClassList;
  protected readonly panelWidthCss = this.core.panelWidthCss;
  readonly fallbackLabels = this.core.fallbackLabels;
  readonly ariaLabels = this.core.ariaLabels;
  protected readonly resolvedId = this.core.resolvedId;
  protected readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  protected readonly resolvedShowSelectionIndicator = this.core.resolvedShowSelectionIndicator;
  protected readonly resolvedSelectionIndicatorVariant =
    this.core.resolvedSelectionIndicatorVariant;
  protected readonly resolvedSelectionIndicatorPosition =
    this.core.resolvedSelectionIndicatorPosition;
  protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly commitErrorId = this.core.commitErrorId;
  /** @internal */ protected readonly listboxId = this.core.listboxId;
  /** @internal */ protected readonly commitErrorText = this.core.commitErrorText;
  protected readonly ariaReadonly = this.core.ariaReadonly;
  protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  protected readonly externalActivation = this.core.externalActivation;
  protected readonly showCommitError = this.core.showCommitError;

  /**
   * Virtualisation wire-up. Routes through `CNGX_PANEL_RENDERER_FACTORY`
   * (override for recycler / custom virtualising renderers); the
   * default identity renderer reads `core.flatOptions` and leaves
   * `virtualItemCount()` `undefined` so AD's setsize falls back to
   * projected-options length. AD↔recycler scroll bridge wired inside.
   */
  private readonly virtualSetup = setupVirtualization<T, T>({
    core: this.core,
    popoverRef: this.popoverRef,
    listboxRef: this.listboxRef,
    virtualization: this.config.virtualization,
    presentation: this.sheetWiring.presentation,
    listboxElement: computed(() => this.listboxEl()?.nativeElement),
  });
  readonly panelRenderer = this.virtualSetup.panelRenderer;
  protected readonly virtualItemCount = this.virtualSetup.virtualItemCount;
  protected readonly virtualWindowStart = this.virtualSetup.virtualWindowStart;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  readonly commitState = this.core.commitState;
  readonly isCommitting = this.core.isCommitting;
  readonly commitErrorValue = this.core.commitErrorValue;

  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());

  /**
   * Routes a failed commit through the family-shared announcer policy.
   *
   * @internal
   */
  private readonly announceCommitError = inject(CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY)({
    deps: {
      announcer: this.announcer,
      commitErrorMessage: (err) => this.core.commitErrorMessage(err),
      softAnnounce: (opt, action, count, multi) =>
        this.core.announce(opt as CngxSelectOptionDef<T> | null, action, count, multi),
    },
    policy: this.commitErrorAnnouncePolicy,
  });

  /**
   * Scalar commit handler. Mirrors `CngxSelect` callbacks:
   *   - `onStateChange('pending')` → eager-close popover (optimistic).
   *   - `onCommitFinalize` → emit `selectionChange`, announce `'added'`.
   *   - `onCommitError` → delegate to announcer.
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
      this.selectionChange.emit({
        source: this,
        value: finalValue,
        previousValue,
        option,
      });
      this.core.announce(option, 'added', option ? 1 : 0, false);
      // Pessimistic: close popover on success (held open while
      // pending). AD dispatcher already closed the optimistic /
      // non-commit path; hide() is idempotent.
      if (this.commitMode() === 'pessimistic') {
        const pop = this.popoverRef();
        if (pop?.isVisible()) {
          this.hostFocus.refocusOwnerBeforeClose();
          pop.hide();
        }
      }
    },
    onCommitError: (err) => this.announceCommitError(err),
    onStateChange: (status) => {
      this.stateChange.emit(status);
      if (status === 'pending' && this.commitMode() === 'optimistic') {
        const pop = this.popoverRef();
        if (pop?.isVisible()) {
          this.hostFocus.refocusOwnerBeforeClose();
          pop.hide();
        }
      }
    },
    onError: (err) => this.commitError.emit(err),
  });

  protected readonly commitErrorContext = this.core.bindCommitRetry(() => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.scalarHandler.retryLast();
  });

  /**
   * Keyboard typeahead controller. Drives typeahead-while-closed and
   * PageUp/PageDown jump via `CNGX_FLAT_NAV_STRATEGY`.
   *
   * @internal
   */
  private readonly typeaheadController = createTypeaheadController<T>({
    options: this.flatOptions,
    compareWith: this.compareWith,
    debounceMs: computed(() => this.config.typeaheadDebounceInterval),
    disabled: this.disabled,
    locale: injectLocale(),
  });

  /**
   * Flat-nav policy. Variant only dispatches the resulting
   * `CngxFlatNavAction`.
   *
   * @internal
   */
  private readonly flatNavStrategy = inject(CNGX_FLAT_NAV_STRATEGY);

  /** Currently selected option resolved against the derived option model. */
  readonly selected = computed<CngxSelectOptionDef<T> | null>(() => this.selectedOption(), {
    equal: (a, b) => {
      if (a === b) {
        return true;
      }
      if (a === null || b === null) {
        return false;
      }
      return (this.compareWith() as CngxSelectCompareFn<unknown>)(a.value, b.value);
    },
  });

  /** Human-readable label displayed on the trigger. */
  readonly triggerValue = computed<string>(() => this.triggerText());

  /** @internal */
  protected readonly selectedOption = computed<CngxSelectOptionDef<T> | null>(() => {
    const v = this.value();
    if (v === undefined || v === null) {
      return null;
    }
    const map = this.core.valueToOptionMap();
    if (map) {
      return map.get(v) ?? null;
    }
    const eq = this.compareWith();
    return this.flatOptions().find((o) => eq(o.value, v)) ?? null;
  });

  /** @internal */
  protected readonly isEmpty = computed<boolean>(() => this.selectedOption() == null);

  /** @internal */
  protected readonly triggerText = computed<string>(() => {
    return this.selectedOption()?.label ?? this.core.resolvedPlaceholder();
  });

  /** @internal */
  protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */
  protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */
  protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */
  protected readonly isCommittingOption = this.core.panelHostAdapter.isCommittingOption;

  // Satisfies the CNGX_SELECT_PANEL_HOST contract; the panel-shell overlay
  // is deferred so nothing in the current template reads it.
  protected readonly unfilteredCount = computed(() => this.core.unfilteredFlatOptions().length);
  protected readonly previousLoadedCount = computed(() => this.flatOptions().length);

  /**
   * Panel-host contract member. The shell renders projected `<cngx-option>`
   * elements only, so a patched item never reaches the panel; dev mode warns
   * with CNGX2024. The buffer still feeds value resolution.
   */
  patchData(item: CngxSelectOptionDef<T>): void {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      cngxDevWarn(
        'CNGX2024',
        '[cngx-select-shell] patchData(): projected options are the source of truth; the patched item is not rendered. Project a <cngx-option> instead.',
      );
    }
    this.localItemsBuffer.patch(item);
  }
  /** Panel-host contract member; see `patchData`. Dev mode warns with CNGX2024. */
  clearLocalItems(): void {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      cngxDevWarn(
        'CNGX2024',
        '[cngx-select-shell] clearLocalItems(): projected options are the source of truth; there are no local items to clear. Remove the <cngx-option> instead.',
      );
    }
    this.localItemsBuffer.clear();
  }

  /**
   * @internal Folded substring match of an option label in the reading
   * locale, cached per stable option record.
   */
  private readonly labelMatch = createListboxLabelMatch(injectLocale());

  /**
   * @internal `CngxOptionFilterHost` policy. Resolves the projected option's
   * stable record so the per-option `hidden` path and the model's filter run
   * hand a matcher the same object. A caller that does not pass the option
   * (a third-party filter host) gets a one-off `{ value, label }` and only
   * loses the per-option cache.
   */
  matches<TVal>(value: TVal, label: string, term: string, option?: CngxOption): boolean {
    const record = option
      ? this.projectedOptionModel.recordFor(option)
      : { value: value as unknown as T, label };
    return this.matchOption(record, term);
  }

  /** @internal `[searchMatchFn]` > `CngxSelectConfig.searchMatchFn` > folded label match. */
  private matchOption(option: CngxSelectMatchOption<T>, term: string): boolean {
    const fn = this.searchMatchFn() ?? this.config.searchMatchFn ?? this.labelMatch;
    return fn(option, term);
  }

  /**
   * Per-value cache for {@link statusFor}. The option directive
   * subscribes once at construction; without memoisation each call
   * from the option's outer computed allocated a fresh inner signal
   * per CD pass. Cleared on `DestroyRef.onDestroy`.
   *
   * @internal
   */
  private readonly statusCache = new Map<unknown, Signal<CngxOptionStatus | null>>();

  /** @internal */
  statusFor<TVal>(value: TVal): Signal<CngxOptionStatus | null> {
    const cached = this.statusCache.get(value);
    if (cached) {
      return cached;
    }
    const sig = computed<CngxOptionStatus | null>(() => {
      const opt = this.core.togglingOption();
      if (!opt) {
        return null;
      }
      const eq = this.compareWith() as CngxSelectCompareFn<unknown>;
      if (!eq(opt.value, value)) {
        return null;
      }
      const err = this.core.commitErrorValue();
      if (err !== undefined && err !== null) {
        return {
          kind: 'error',
          tpl: this.tpl.optionError() as TemplateRef<unknown> | null,
        };
      }
      if (this.isCommitting()) {
        return {
          kind: 'pending',
          tpl: this.tpl.optionPending() as TemplateRef<unknown> | null,
        };
      }
      return null;
    });
    this.statusCache.set(value, sig);
    return sig;
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.statusCache.clear());

    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Lifecycle + routing in createADActivationDispatcher; value-shape
    // work (snapshot, finalize) stays here.
    createADActivationDispatcher<T, T>({
      beforeHide: () => this.hostFocus.refocusOwnerBeforeClose(),
      listboxRef: this.listboxRef,
      core: this.core,
      popoverRef: this.popoverRef,
      closeOnSelect: true,
      commitAction: this.commitAction,
      onCommit: (intended, opt) => this.scalarHandler.dispatchFromActivation(intended, opt),
      onActivate: (intended, opt) => {
        // Snapshot previous before the listbox's activation subscriber
        // writes through [(value)]. RxJS Subject fires subscribers in
        // registration order; the listbox runs first, so
        // `untracked(value)` may already be the new value.
        const previous = untracked(() => this.value());
        this.scalarHandler.finalizeSelection(intended, opt, previous);
      },
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

    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) => (this.compareWith() as CngxSelectCompareFn<unknown>)(a, b),
      coerceFromField: (x) => x as T | undefined,
    });

    inject(CNGX_SEARCH_EFFECTS_FACTORY)({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      open: () => this.open(),
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
    this.triggerBtn()?.nativeElement.focus(options);
  }

  /** @internal */
  protected handleTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggle();
  }

  /**
   * Trigger keyboard. Typeahead-while-closed (native `<select>` parity)
   * and PageUp/PageDown jump-N - both delegate to
   * {@link flatNavStrategy}.
   *
   * @internal
   */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched - the same guard the nav strategies and CngxListboxTrigger
    // apply. Shift stays allowed.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const lb = this.listboxRef();
    const pop = this.popoverRef();

    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        const eq = this.compareWith();
        const flat = this.flatOptions();
        const v = this.value();
        const currentFlatIndex =
          v === undefined || v === null ? -1 : flat.findIndex((o) => eq(o.value, v));
        const action = this.flatNavStrategy.onTypeaheadWhileClosed(
          {
            options: flat,
            listboxItems: lb?.options() ?? [],
            currentFlatIndex,
            currentListboxIndex: -1,
            compareWith: eq,
            disabled: this.disabled(),
            typeaheadController: this.typeaheadController,
          },
          key,
        );
        if (action.kind === 'select') {
          event.preventDefault();
          const previous = v;
          this.value.set(action.option.value);
          this.selectionChange.emit({
            source: this,
            value: action.option.value,
            previousValue: previous,
            option: action.option,
          });
          this.core.announce(action.option, 'added', 1, false);
          return;
        }
      }
    }

    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      if (!pop || !lb) {
        return;
      }
      if (!pop.isVisible()) {
        pop.show();
      }
      const { items, currentIndex: currentListboxIndex } = resolvePageJumpSpace(
        lb,
        this.visibleProjectedOptions,
      );
      const direction: 1 | -1 = event.key === 'PageDown' ? 1 : -1;
      const action = this.flatNavStrategy.onPageJump(
        {
          options: this.flatOptions(),
          listboxItems: items,
          currentFlatIndex: -1,
          currentListboxIndex,
          compareWith: this.compareWith(),
          disabled: this.disabled(),
          typeaheadController: this.typeaheadController,
        },
        direction,
      );
      if (action.kind === 'highlight') {
        lb.ad.highlightByIndex(action.index);
      }
    }
  }

  // CngxOptionInteractionHost: projected `<cngx-option>` elements
  // inject AD `{ optional: true }`; when missing they fall back to
  // this host via `CNGX_OPTION_INTERACTION_HOST` and call
  // `activate()` / `highlight()` from their click + pointerenter
  // handlers. State is derived, so no DOM walking and no event delegation.

  /** @internal */
  activate(value: unknown): void {
    if (this.disabled()) {
      return;
    }
    const ad = this.listboxRef()?.ad;
    if (!ad) {
      return;
    }
    ad.highlightByValue(value);
    ad.activateCurrent();
  }

  /** @internal */
  highlight(value: unknown): void {
    if (this.disabled()) {
      return;
    }
    this.listboxRef()?.ad.highlightByValue(value);
  }

  /**
   * @internal A projected `<cngx-select-search>` leads the sheet when the
   * open came from the keyboard: it sits before the listbox, and the sheet
   * focuses the first enabled marker in document order. A tap opens on the
   * listbox. Called once the search has rendered.
   */
  registerSheetInitialFocus(element: HTMLElement): () => void {
    const registry = this.sheetRef()?.initialFocusRegistry;
    if (!registry) {
      return () => undefined;
    }
    const key = nextUid('cngx-select-shell-search-focus');
    const handle = { element, enabled: this.sheetWiring.searchLeads };
    registry.register(key, handle);
    return () => registry.unregister(key, handle);
  }

  /** @internal - click-outside dismissal. */
  protected readonly handleClickOutside = this.sheetWiring.handleClickOutside;

  /** @internal */
  handleRetry(): void {
    this.hostFocus.refocusOwnerBeforeRemoval();
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** @internal */
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
    this.hostFocus.refocusOwnerBeforeRemoval();
    const current = this.value();
    if (current === undefined || current === null) {
      return;
    }
    this.value.set(undefined);
    this.selectionChange.emit({
      source: this,
      value: undefined,
      previousValue: current,
      option: null,
    });
    this.core.announce(null, 'removed', 0, false);
  }

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
}
