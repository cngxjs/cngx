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
  signal,
  untracked,
  viewChild,
  type ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import { CNGX_STATEFUL, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

import { CngxChip } from '@cngx/common/display';
import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxSearch,
  CngxListboxTrigger,
  type ListboxMatchFn,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger, type PopoverPlacement } from '@cngx/common/popover';

import { CngxSelectPanel } from '../shared/internal/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { createArrayCommitHandler, type ArrayCommitHandler } from '../shared/array-commit-handler';
import {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
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
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { handlePageJumpKey } from '../shared/internal/page-jump-handler';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
} from '../shared/internal/select-core';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import {
  CngxComboboxTriggerLabel,
  type CngxComboboxTriggerLabelContext,
  CngxMultiSelectChip,
  type CngxMultiSelectChipContext,
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
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  type CngxSelectInputSlotContext,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxActionMultiSelect.selectionChange}.
 * `action` mirrors the flat multi family plus `'create'` - `added`
 * carries exactly the one new value and `removed` is empty, so delta-
 * aggregating consumers treat create identically to toggle-add.
 *
 * @category forms/select/action-multi-select
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
 * @category forms/select/action-multi-select
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/action-multi-select/action-multi-select.component.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxActionSelect, CngxCombobox, CngxSelectAction
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/action-multi-select/basic</example-url>
 */
@Component({
  selector: 'cngx-action-multi-select',
  exportAs: 'cngxActionMultiSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxChip,
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
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxActionMultiSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxActionMultiSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxActionMultiSelect },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxActionMultiSelect },
  ],
  host: {
    class: 'cngx-action-multi-select',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  templateUrl: './action-multi-select.component.html',
  styleUrls: ['../shared/select-base.css', './action-multi-select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxActionMultiSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();
  private readonly actionConfig = resolveActionSelectConfig();

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
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);
  /** Debounce for the inline search (ms). Default `0` for action-slot feedback. */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);
  readonly skipInitial = input<boolean>(false);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<CngxSelectSelectionIndicatorVariant | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Reset selection',
  );
  readonly chipRemoveAriaLabel = input<string>(this.config.ariaLabels?.chipRemove ?? 'Remove');
  readonly loading = input<boolean>(false);
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);
  readonly retryFn = input<(() => void) | null>(null);
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(this.config.commitErrorDisplay);
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  /**
   * Quick-create handler. `null` disables the create path - slot still
   * renders, `commit()` becomes a silent no-op.
   */
  readonly quickCreateAction = input<CngxSelectCreateAction<T> | null>(null);
  /**
   * Whether a successful create closes the panel. Default `false` -
   * multi-pick UX keeps the panel open. Set `true` for confirm-to-
   * create workflows.
   */
  readonly closeOnCreate = input<boolean>(this.actionConfig.closeOnCreate ?? false);
  /**
   * Fall back to raw `<input>.value` when debounced `searchTerm`
   * hasn't caught up.
   */
  readonly liveInputFallback = input<boolean>(this.actionConfig.liveInputFallback);
  /** Position of `*cngxSelectAction` in the panel. */
  readonly actionPosition = input<'top' | 'bottom' | 'both' | 'none'>(
    this.actionConfig.actionPosition,
  );
  /**
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxActionSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.actionConfig.popoverPlacement);
  /** Mobile `inputmode`. Defaults from `CngxSelectConfig.inputMode`. */
  readonly inputMode = input<NonNullable<CngxSelectConfig['inputMode']>>(this.config.inputMode);
  /**
   * Mobile `enterkeyhint`. Default `'enter'` - Enter appends a chip
   * without closing the panel.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'enter',
  );
  /** Chip-strip overflow strategy. */
  readonly chipOverflow = input<NonNullable<CngxSelectConfig['chipOverflow']>>(
    this.config.chipOverflow,
  );
  /** Max chips in `'truncate'` mode. */
  readonly maxVisibleChips = input<number>(this.config.maxVisibleChips);

  /** Two-way multi-value binding. */
  readonly values = model<T[]>([]);

  readonly selectionChange = output<CngxActionMultiSelectChange<T>>();
  readonly optionToggled = output<{
    readonly option: CngxSelectOptionDef<T>;
    readonly added: boolean;
  }>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();
  readonly searchTermChange = output<string>();
  /** Dedicated channel for successful creates. Fires after `selectionChange`. */
  readonly created = output<CngxSelectOptionDef<T>>();

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
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
  private readonly actionDirective = contentChild<CngxSelectAction>(CngxSelectAction);

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

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);
  readonly searchTerm: Signal<string> = computed(() => this.searchInputRef()?.term() ?? '');

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);
  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal */ readonly focused = this.focusState.focused;
  readonly empty = computed<boolean>(() => this.isEmpty());

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

  private readonly core = createSelectCore<T, T[]>(
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
      multi: computed(() => true),
      currentSelection: this.values,
      multiValues: this.values,
      selectionIndicatorPosition: this.selectionIndicatorPosition,
      selectionIndicatorVariant: this.selectionIndicatorVariant,
      localItems: this.localItemsBuffer.items,
    },
    {
      announceChanges: this.announceChanges,
      announceTemplate: this.announceTemplate,
    },
  );

  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

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

  /** @internal */
  protected readonly inputSlotContext = computed<CngxSelectInputSlotContext>(
    () => ({ disabled: this.disabled(), focused: this.focused(), panelOpen: this.panelOpen() }),
    {
      equal: (a, b) =>
        a.disabled === b.disabled && a.focused === b.focused && a.panelOpen === b.panelOpen,
    },
  );

  readonly commitState = this.core.commitState;
  /**
   * `true` while either the toggle/clear or quick-create commit is
   * pending. The two run on separate controllers but a consumer
   * observing "is any write in flight?" gets a single truthy signal.
   */
  readonly isCommitting = computed<boolean>(
    () => this.core.isCommitting() || this.createCommitController.isCommitting(),
  );
  /** @internal */
  readonly commitErrorValue = this.core.commitErrorValue;
  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.commitHandler.retryLast(),
  );

  /** @internal - full virtualisation wire-up (see setupVirtualization). */
  private readonly virtualSetup = setupVirtualization<T, T[]>({
    core: this.core,
    popoverRef: this.popoverRef,
    listboxRef: this.listboxRef,
    virtualization: this.config.virtualization,
  });
  /** @internal */
  readonly panelRenderer = this.virtualSetup.panelRenderer;
  /** @internal */
  protected readonly virtualItemCount = this.virtualSetup.virtualItemCount;

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
    return this.placeholder() || this.label() || '';
  });

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  /** @internal - chip subset + overflow badge count (see CngxMultiSelect). */
  protected readonly visibleSelected = computed<CngxSelectOptionDef<T>[]>(() => {
    const all = this.selectedOptions();
    if (this.chipOverflow() !== 'truncate') {
      return all;
    }
    const cap = Math.max(1, this.maxVisibleChips());
    return all.length <= cap ? all : all.slice(0, cap);
  });
  /** @internal */
  protected readonly overflowBadgeCount = computed<number>(() => {
    if (this.chipOverflow() !== 'truncate') {
      return 0;
    }
    const total = this.selectedOptions().length;
    const cap = Math.max(1, this.maxVisibleChips());
    return total > cap ? total - cap : 0;
  });

  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      // Chip strip resolves against the UNFILTERED option merge so
      // chips for previously-picked values stay visible when the
      // search term hides the matching option from the listbox.
      const eq = this.compareWith();
      const out: CngxSelectOptionDef<T>[] = [];
      const flat = this.core.unfilteredFlatOptions();
      for (const v of vals) {
        const match = flat.find((o) => eq(o.value, v));
        if (match) {
          out.push(match);
        }
      }
      return out;
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!Object.is(a[i], b[i])) {
            return false;
          }
        }
        return true;
      },
    },
  );

  private readonly togglingOption = this.core.togglingOption;
  private lastCommittedValues: T[] = [];
  private readonly hasEmittedInitial = signal(false);

  private readonly commitHandler: ArrayCommitHandler<T> = createArrayCommitHandler<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    core: this.core,
    commitAction: this.commitAction,
    getLastCommitted: () => this.lastCommittedValues,
    onToggleFinalize: (option, isNowSelected) =>
      this.finalizeToggle(option, isNowSelected, this.lastCommittedValues),
    onClearFinalize: (previous, finalValues) => {
      this.cleared.emit();
      this.selectionChange.emit({
        source: this,
        values: finalValues,
        previousValues: previous,
        added: [],
        removed: previous,
        option: null,
        action: 'clear',
      });
    },
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
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
      const next = [...previousValues, option.value];
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
    onError: (err) => this.commitError.emit(err),
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
    onSyncFinalize: (item, previous) => this.finalizeToggle(item, false, previous),
  });

  /** @internal - stable per-option `remove()` closure for chip slots. */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    return this.chipRemovalHandler.removeFor(opt);
  }

  constructor() {
    this.lastCommittedValues = untracked(() => [...this.values()]);

    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    createADActivationDispatcher<T, T[]>({
      listboxRef: this.listboxRef,
      core: this.core,
      closeOnSelect: false,
      commitAction: this.commitAction,
      onCommit: (toggledValue, opt) => {
        const previous = [...this.values()];
        const wasSelected = previous.some((v) => this.compareWith()(v, toggledValue));
        const next = wasSelected
          ? previous.filter((v) => !this.compareWith()(v, toggledValue))
          : [...previous, toggledValue];
        this.lastCommittedValues = previous;
        this.togglingOption.set(opt);
        if (this.commitMode() === 'optimistic') {
          this.values.set(next);
        }
        const action = this.commitAction();
        if (action) {
          this.commitHandler.beginToggle(next, previous, opt, action);
        }
      },
      onActivate: (_value, opt) => {
        const currentSelected = this.isSelected(opt);
        const current = this.values();
        const eq = this.compareWith();
        const previousValues = currentSelected
          ? current.filter((v) => !eq(v, opt.value))
          : [...current, opt.value];
        this.finalizeToggle(opt, currentSelected, previousValues);
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
      open: () => this.open(),
      emit: {
        hasEmittedInitial: this.hasEmittedInitial,
        skipInitial: this.skipInitial,
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
    this.inputEl()?.nativeElement.focus(options);
  }

  /**
   * Enter on the trigger input fires quick-create when no AD item is
   * active, `quickCreateAction` is bound, and the term is non-empty.
   * Tag-input keyboard UX: type, Enter, chip appears.
   *
   * @internal
   */
  protected handleTriggerEnter(event: Event): void {
    const ad = this.listboxRef()?.ad;
    if (ad?.activeItem()) {
      return;
    }
    if (!this.quickCreateAction()) {
      return;
    }
    const term = this.resolveLiveTerm();
    if (term === '') {
      return;
    }
    event.preventDefault();
    this.handleActionCommit();
  }

  /** @internal - PageUp/PageDown shared behaviour (±10 option jump). */
  protected handleInputKeydown(event: KeyboardEvent): void {
    handlePageJumpKey(event, {
      listbox: this.listboxRef(),
      popover: this.popoverRef(),
    });
  }

  private handleActionCommit(draft?: { label: string }): void {
    const term = this.resolveLiveTerm();
    const effective = draft ?? { label: term };
    if (effective.label === '') {
      return;
    }
    const previousValues = [...this.values()];
    this.createHandler.dispatch(effective, term, previousValues);
  }

  /**
   * Live search-term accessor. Same contract as
   * {@link CngxActionSelect}; both organisms honour the
   * `liveInputFallback` switch identically.
   *
   * @internal
   */
  private resolveLiveTerm(): string {
    const term = this.searchTerm();
    if (term !== '' || !this.liveInputFallback()) {
      return term;
    }
    return this.inputEl()?.nativeElement.value ?? '';
  }

  protected handleWrapperClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, .cngx-chip__remove')) {
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

  protected handleChipRemoveClick(event: Event, opt: CngxSelectOptionDef<T>): void {
    event.stopPropagation();
    this.chipRemovalHandler.removeByValue(opt);
  }

  /** @internal */
  protected removeLastChip(): void {
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return;
    }
    this.chipRemovalHandler.removeByValue(selected[selected.length - 1]);
  }

  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAllCallback();
  }

  /** @internal */
  protected readonly clearAllCallback: () => void = () => {
    const previous = [...this.values()];
    if (previous.length === 0) {
      return;
    }
    const action = this.commitAction();
    if (action) {
      this.lastCommittedValues = previous;
      this.togglingOption.set(null);
      if (this.commitMode() === 'optimistic') {
        this.values.set([]);
      }
      this.commitHandler.beginClear(previous, action);
      return;
    }
    this.values.set([]);
    this.cleared.emit();
    this.selectionChange.emit({
      source: this,
      values: [],
      previousValues: previous,
      added: [],
      removed: previous,
      option: null,
      action: 'clear',
    });
    this.core.announce(null, 'removed', 0, true);
  };

  protected handleFocus(): void {
    this.focusState.markFocused();
  }

  protected handleBlur(): void {
    this.focusState.markBlurred();
    this.presenter?.fieldState().markAsTouched();
  }

  private finalizeToggle(
    opt: CngxSelectOptionDef<T>,
    isNowSelected: boolean,
    previousValues: readonly T[] = [],
  ): void {
    this.optionToggled.emit({ option: opt, added: isNowSelected });
    this.selectionChange.emit({
      source: this,
      values: this.values(),
      previousValues,
      added: isNowSelected ? [opt.value] : [],
      removed: isNowSelected ? [] : [opt.value],
      option: opt,
      action: 'toggle',
    });
    this.core.announce(opt, isNowSelected ? 'added' : 'removed', this.values().length, true);
  }
}
