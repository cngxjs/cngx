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
  signal,
  untracked,
  type ElementRef,
  type Signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';

import { CNGX_STATEFUL, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
  CNGX_OPTION_CONTAINER,
  CNGX_OPTION_FILTER_HOST,
  CNGX_OPTION_INTERACTION_HOST,
  CNGX_OPTION_STATUS_HOST,
  type CngxOptionFilterHost,
  type CngxOptionInteractionHost,
  type CngxOptionStatus,
  type CngxOptionStatusHost,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger, type PopoverPlacement } from '@cngx/common/popover';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { CngxSelectAnnouncer } from '../shared/announcer';
import { CNGX_FLAT_NAV_STRATEGY } from '../shared/flat-nav-strategy';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
  type CngxSelectSelectionIndicatorVariant,
} from '../shared/config';
import {
  type CngxSelectCommitAction,
  type CngxSelectCommitErrorDisplay,
  type CngxSelectCommitMode,
} from '../shared/commit-action.types';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import { type CngxSelectOptionDef, type CngxSelectOptionsInput } from '../shared/option.model';
import { CNGX_PROJECTED_OPTION_MODEL_FACTORY } from '../shared/projected-option-model';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from '../shared/panel-host';
import { CngxSelectPanelShell } from '../shared/panel-shell/panel-shell.component';
import {
  CNGX_SELECT_SHELL_SEARCH_HOST,
  type CngxSelectShellSearchHost,
} from '../declarative/select-search-host';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
} from '../shared/internal/select-core';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import { createTypeaheadController } from '../shared/typeahead-controller';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import {
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectLoadingGlyph,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
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

/**
 * Change event emitted by {@link CngxSelectShell.selectionChange} on
 * a user pick.
 *
 * @category forms/select/shell
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
 * @category forms/select/shell
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/select-shell/select-shell.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider, CngxSelectSearch
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/select-shell/basic-flat-declarative-options</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/custom-glyphs-clearglyph-caretglyph</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/grouped-divider-projected-hierarchy</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/inside-cngx-form-field-reactive-forms</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/rich-content-option-plain-text-trigger</example-url>
 * <example-url>http://localhost:4200/#/forms/select/select-shell/search-declarative-cngx-select-search</example-url>
 */
@Component({
  selector: 'cngx-select-shell',
  exportAs: 'cngxSelectShell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanelShell,
    NgTemplateOutlet,
  ],
  providers: [
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
    { provide: CNGX_SELECT_SHELL_SEARCH_HOST, useExisting: CngxSelectShell },
  ],
  host: {
    class: 'cngx-select-shell',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
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

  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
  readonly requiredInput = input<boolean>(false, { alias: 'required' });
  readonly compareWith = input<CngxSelectCompareFn<T>>(
    cngxSelectDefaultCompare as CngxSelectCompareFn<T>,
  );
  readonly idInput = input<string | null>(null, { alias: 'id' });
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });
  readonly tabIndex = input<number>(0);
  readonly autofocus = input<boolean>(false);
  readonly panelClass = input<string | readonly string[] | null>(null);
  readonly panelWidth = input<'trigger' | number | null>(this.config.panelWidth);
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<CngxSelectSelectionIndicatorVariant | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Clear selection',
  );
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  readonly loading = input<boolean>(false);
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);
  readonly retryFn = input<(() => void) | null>(null);
  readonly commitAction = input<CngxSelectCommitAction<T> | null>(null);
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(this.config.commitErrorDisplay);
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);
  /**
   * Scalar-commit error-announce policy. Per-instance input wins over
   * `CngxSelectConfig.commitErrorAnnouncePolicy`. Default
   * `{ kind: 'verbose', severity: 'assertive' }`.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );

  /** Two-way bindable selected value. */
  readonly value = model<T | undefined>(undefined);

  /**
   * Two-way bindable search term. Drives per-option visibility through
   * `CngxOptionFilterHost` and filters the listbox AD so keyboard nav
   * skips hidden options. Empty string disables the filter.
   */
  readonly searchTerm = model<string>('');

  /**
   * Per-instance match policy. Receives `(value, label, term)` and
   * returns `true` when the option should stay visible. Default:
   * case-insensitive substring on the label.
   */
  readonly searchMatchFn = input<((value: T, label: string, term: string) => boolean) | null>(null);

  /**
   * Debounce for `searchTermChange` (ms). Forward-compatible input -
   * the shipped `CNGX_SEARCH_EFFECTS_FACTORY` emits immediately;
   * consumers overriding the factory read this signal to size their
   * pipeline.
   */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);

  readonly selectionChange = output<CngxSelectShellChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();
  /**
   * Live search term emitted via `CNGX_SEARCH_EFFECTS_FACTORY`. The
   * factory's `skipInitial` gate suppresses the seed `''` emission so
   * server-driven autocomplete consumers don't fire a blank search.
   */
  readonly searchTermChange = output<string>();

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
    matches: (value, label, term) => this.matches(value, label, term),
  });

  protected readonly derivedOptions = this.projectedOptionModel.derivedOptions;
  protected readonly projectedOptions = this.projectedOptionModel.projectedOptions;
  protected readonly visibleProjectedOptions = this.projectedOptionModel.visibleProjectedOptions;
  protected readonly adItems = this.projectedOptionModel.adItems;

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
  private readonly triggerLabelDirective =
    contentChild<CngxSelectTriggerLabel<T>>(CngxSelectTriggerLabel);
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
  });

  /**
   * Variant-specific trigger-label slot. Inline because the directive's
   * typed context shape varies per variant.
   */
  protected readonly triggerLabelTpl = computed<TemplateRef<
    CngxSelectTriggerLabelContext<T>
  > | null>(() => this.triggerLabelDirective()?.templateRef ?? null);

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
        focused: this.focused(),
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

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  readonly focused = this.focusState.focused;

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
  private readonly core = createSelectCore<T, T>(
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
      panelOpen: this.panelOpen,
      errorState: this.errorState,
      multi: computed(() => false),
      currentSelection: this.value,
      selectionIndicatorPosition: this.selectionIndicatorPosition,
      selectionIndicatorVariant: this.selectionIndicatorVariant,
      localItems: this.localItemsBuffer.items,
    },
    {
      announceChanges: this.announceChanges,
      announceTemplate: this.announceTemplate,
    },
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
  });
  readonly panelRenderer = this.virtualSetup.panelRenderer;
  protected readonly virtualItemCount = this.virtualSetup.virtualItemCount;

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
          pop.hide();
        }
      }
    },
    onError: (err) => this.commitError.emit(err),
  });

  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

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
  });

  /**
   * Flat-nav policy. Variant only dispatches the resulting
   * `CngxFlatNavAction`.
   *
   * @internal
   */
  private readonly flatNavStrategy = inject(CNGX_FLAT_NAV_STRATEGY);

  /**
   * Tracks whether the seed `searchTermChange` emission has fired.
   * Combined with `skipInitial` to suppress the hydrate-time `''`.
   *
   * @internal
   */
  private readonly hasEmittedInitial = signal(false);

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
    const fallback = this.placeholder() || this.label();
    return this.selectedOption()?.label ?? fallback;
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
  // is deferred (plan Phase 10) so nothing in the current template reads it.
  protected readonly unfilteredCount = computed(() => this.core.unfilteredFlatOptions().length);
  protected readonly previousLoadedCount = computed(() => this.flatOptions().length);

  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }
  clearLocalItems(): void {
    this.localItemsBuffer.clear();
  }

  /** @internal */
  matches<TVal>(value: TVal, label: string, term: string): boolean {
    const fn = this.searchMatchFn();
    if (fn) {
      return fn(value as unknown as T, label, term);
    }
    return label.toLowerCase().includes(term.toLowerCase());
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
      emit: {
        hasEmittedInitial: this.hasEmittedInitial,
        skipInitial: signal(true),
        onEmit: (term) => this.searchTermChange.emit(term),
      },
    });
  }

  open(): void {
    this.popoverRef()?.show();
  }
  close(): void {
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

  /**
   * Trigger keyboard. Typeahead-while-closed (native `<select>` parity)
   * and PageUp/PageDown jump-N - both delegate to
   * {@link flatNavStrategy}.
   *
   * @internal
   */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
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
      const items = lb.options();
      const ad = lb.ad;
      const currentId = ad.activeId();
      const currentListboxIndex = items.findIndex((o) => o.id === currentId);
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
        ad.highlightByIndex(action.index);
      }
    }
  }

  // CngxOptionInteractionHost: projected `<cngx-option>` elements
  // inject AD `{ optional: true }`; when missing they fall back to
  // this host via `CNGX_OPTION_INTERACTION_HOST` and call
  // `activate()` / `highlight()` from their click + pointerenter
  // handlers. Pillar 1 derivation - no DOM walking, no event delegation.

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

  /** @internal - click-outside dismissal. */
  protected readonly handleClickOutside = inject(CNGX_DISMISS_HANDLER_FACTORY)({
    popoverRef: this.popoverRef,
    dismissOn: this.config.dismissOn,
  }).handleClickOutside;

  /** @internal */
  handleRetry(): void {
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** @internal */
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
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
  protected handleFocus(): void {
    this.focusState.markFocused();
    if (this.config.openOn === 'focus' || this.config.openOn === 'click+focus') {
      this.open();
    }
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusState.markBlurred();
    this.presenter?.fieldState().markAsTouched();
  }
}
