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
  type ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import { CNGX_STATEFUL, type CngxAsyncState, type AsyncStatus } from '@cngx/core/utils';

import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxSearch,
  CngxListboxTrigger,
  type ListboxMatchFn,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger, type PopoverPlacement } from '@cngx/common/popover';

import { CngxSelectPanel } from '../shared/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { CNGX_DISPLAY_BINDING_FACTORY, type DisplayBinding } from '../shared/display-binding';
import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
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
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { resolveSelectConfig } from '../shared/resolve-config';
import { handlePageJumpKey } from '../shared/page-jump-handler';
import { setupVirtualization } from '../shared/setup-virtualization';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
} from '../shared/select-core';
import {
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
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  type CngxSelectInputSlotContext,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxTypeahead.selectionChange}.
 *
 * @category forms/select/typeahead
 */
export interface CngxTypeaheadChange<T = unknown> {
  readonly source: CngxTypeahead<T>;
  readonly value: T | undefined;
  /**
   * Value before the change committed. Populated from the AD-activation
   * snapshot, the commit-controller rollback target, and the pre-clear
   * value.
   */
  readonly previousValue: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Single-value async autocomplete. Inline `<input role="combobox">`
 * with `aria-autocomplete="list"`. Input text is driven by
 * {@link CngxTypeahead.displayWith}; `clearOnBlur` restores the last
 * committed display on stray keystrokes.
 *
 * Stateless graph in {@link createSelectCore}; this component is a
 * thin scalar-value adapter.
 *
 * @category forms/select/typeahead
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/typeahead/typeahead.component.ts
 * @since 0.1.0
 * @relatedTo CngxCombobox, CngxSelect, CngxMultiSelect
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/typeahead/typeahead-bound-to-a-typed-form-field</example-url>
 * <example-url>http://localhost:4200/#/forms/select/typeahead/typeahead-cngxselectoptionlabel-slot-override</example-url>
 */
@Component({
  selector: 'cngx-typeahead',
  exportAs: 'cngxTypeahead',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxClickOutside,
    CngxListbox,
    CngxListboxSearch,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxTypeahead },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxTypeahead);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxTypeahead },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxTypeahead },
  ],
  host: {
    class: 'cngx-typeahead',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  templateUrl: './typeahead.component.html',
  styleUrls: ['../shared/select-base.css', './typeahead.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxTypeahead<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

  readonly label = input<string>('');
  readonly options = input<CngxSelectOptionsInput<T>>([] as CngxSelectOptionsInput<T>);
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
  /**
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  /** Mobile `inputmode`. Defaults from `CngxSelectConfig.inputMode`. */
  readonly inputMode = input<NonNullable<CngxSelectConfig['inputMode']>>(this.config.inputMode);
  /**
   * Mobile `enterkeyhint`. Default `'done'` - Typeahead commits Enter
   * and closes the panel.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'done',
  );
  /** Formatter from value to input text. */
  readonly displayWith = input<(value: T) => string>((v) => String(v));
  /** When `true` (default), blur without a pick resets to `displayWith(value())`. */
  readonly clearOnBlur = input<boolean>(true);
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);
  readonly skipInitial = input<boolean>(false);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<CngxSelectSelectionIndicatorVariant | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Reset selection',
  );
  /**
   * Replaces the built-in `✕` glyph inside the default clear button.
   * Ignored when `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in `▾` caret glyph. Ignored when
   * `*cngxSelectCaret` is projected.
   */
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
   * `{ kind: 'soft' }` - typeahead UX shouldn't interrupt the
   * free-text flow with assertive reads on commit rollback.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'soft' },
  );

  /** Two-way single-value binding. */
  readonly value = model<T | undefined>(undefined);

  readonly selectionChange = output<CngxTypeaheadChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();
  readonly searchTermChange = output<string>();

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
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
  private readonly inputPrefixDirective =
    contentChild<CngxSelectInputPrefix>(CngxSelectInputPrefix);
  private readonly inputSuffixDirective =
    contentChild<CngxSelectInputSuffix>(CngxSelectInputSuffix);

  /** @internal */
  protected readonly tpl = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    check: this.checkDirective,
    caret: this.caretDirective,
    optgroup: this.optgroupDirective,
    placeholder: this.placeholderDirective,
    empty: this.emptyDirective,
    loading: this.loadingDirective,
    optionLabel: this.optionLabelDirective,
    error: this.errorDirective,
    retryButton: this.retryButtonDirective,
    refreshing: this.refreshingDirective,
    commitError: this.commitErrorDirective,
    clearButton: this.clearButtonDirective,
    optionPending: this.optionPendingDirective,
    optionError: this.optionErrorDirective,
  });
  /** @internal */ protected readonly inputPrefixTpl =
    computed<TemplateRef<CngxSelectInputSlotContext> | null>(
      () => this.inputPrefixDirective()?.templateRef ?? null,
    );
  /** @internal */ protected readonly inputSuffixTpl =
    computed<TemplateRef<CngxSelectInputSlotContext> | null>(
      () => this.inputSuffixDirective()?.templateRef ?? null,
    );

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly searchInputRef = viewChild(CngxListboxSearch);
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);
  readonly searchTerm: Signal<string> = computed(() => this.searchInputRef()?.term() ?? '');

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);
  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal */ readonly focused = this.focusState.focused;
  readonly empty = computed<boolean>(() => this.value() === undefined);

  /** @internal */
  protected readonly effectiveMatchFn = computed<ListboxMatchFn>(
    () =>
      this.searchMatchFn() ??
      ((option, term) => {
        if (term === '') {
          return true;
        }
        return option.label.toLowerCase().includes(term.toLowerCase());
      }),
  );

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

  /** @internal */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
  });
  /** @internal */ readonly actionDirty = this.actionBridge.dirty;
  /** @internal */ readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */ readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;

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
      panelOpen: this.panelOpen,
      errorState: this.errorState,
      filter: this.filter,
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

  /** @internal - reactive context for the input prefix/suffix template outlets. */
  protected readonly inputSlotContext = computed<CngxSelectInputSlotContext>(
    () => ({ disabled: this.disabled(), focused: this.focused(), panelOpen: this.panelOpen() }),
    {
      equal: (a, b) =>
        a.disabled === b.disabled && a.focused === b.focused && a.panelOpen === b.panelOpen,
    },
  );
  readonly commitState = this.core.commitState;
  readonly isCommitting = this.core.isCommitting;
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

  /** @internal - full virtualisation wire-up (see setupVirtualization). */
  private readonly virtualSetup = setupVirtualization<T, T>({
    core: this.core,
    popoverRef: this.popoverRef,
    listboxRef: this.listboxRef,
    virtualization: this.config.virtualization,
  });
  /** @internal */
  readonly panelRenderer = this.virtualSetup.panelRenderer;
  /** @internal */
  protected readonly virtualItemCount = this.virtualSetup.virtualItemCount;

  /**
   * Currently selected option, resolved against `options`. Structural
   * equal on `.value` under `compareWith` - fresh OptionDef references
   * for the same value don't cascade re-renders (server refetch).
   */
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
      return this.flatOptions().find((o) => eq(o.value, v)) ?? null;
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
   * Value ↔ input-text reconciliation. Owns `writingFromValue`,
   * skipInitial-aware `searchTermChange` forwarding, imperative
   * `writeFromValue` seed. Resolved via `CNGX_DISPLAY_BINDING_FACTORY`
   * for telemetry / audit / custom reset-policy override.
   */
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

  /**
   * Scalar commit handler. Typeahead wrinkles:
   *   - `onValueWrite` mirrors the value into the `<input>` via the
   *     display binding.
   *   - `onCommitFinalize` emits only when the option resolved; an
   *     unresolved value can't be described to AT, so the change event
   *     is dropped.
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
      if (option === null || finalValue === undefined) {
        return;
      }
      this.selectionChange.emit({
        source: this,
        value: finalValue,
        previousValue,
        option,
      });
      this.core.announce(option, 'added', 1, false);
    },
    onCommitError: (err) => this.announceCommitError(err),
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
    onValueWrite: (v) => this.display.writeFromValue(v),
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
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
      this.display.writeFromValue(this.value());
    });

    // closeOnSelect: picking hides the panel and seeds the input.
    createADActivationDispatcher<T, T>({
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
    });

    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) => (this.compareWith() as CngxSelectCompareFn<unknown>)(a, b),
      coerceFromField: (x) => x as T | undefined,
    });

    // Auto-open on typing. `autoOpenGate` blocks during library-authored
    // writes (display-binding seed, commit reconciliation, blur restore)
    // so internal writes don't re-open a panel the user just closed.
    // Emit path is owned by `onUserSearchTerm` on the display binding -
    // `emit` left undefined here.
    inject(CNGX_SEARCH_EFFECTS_FACTORY)({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      open: () => this.open(),
      autoOpenGate: () => !this.display.isWritingFromValue(),
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
    this.inputEl()?.nativeElement.focus(options);
  }

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
  protected readonly handleClickOutside = inject(CNGX_DISMISS_HANDLER_FACTORY)({
    popoverRef: this.popoverRef,
    dismissOn: this.config.dismissOn,
    shouldBlockDismiss: this.actionBridge.shouldBlockDismiss,
  }).handleClickOutside;

  protected handleRetry(): void {
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
    });
    this.core.announce(null, 'removed', 0, false);
  };

  protected handleFocus(): void {
    this.focusState.markFocused();
  }

  protected handleBlur(): void {
    this.focusState.markBlurred();
    this.presenter?.fieldState().markAsTouched();
    // Snap input back to `displayWith(value)` when text drifted from
    // the committed value. Disable via `[clearOnBlur]="false"`.
    if (this.clearOnBlur()) {
      this.display.writeFromValue(this.value());
    }
  }

  /** @internal - PageUp/PageDown shared behaviour (±10 option jump). */
  protected handleInputKeydown(event: KeyboardEvent): void {
    handlePageJumpKey(event, {
      listbox: this.listboxRef(),
      popover: this.popoverRef(),
    });
  }
}
