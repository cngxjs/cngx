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

import { CNGX_STATEFUL, type CngxAsyncState, type AsyncStatus } from '@cngx/core/utils';

import { CngxChip } from '@cngx/common/display';
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
import {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
import { createArrayCommitHandler, type ArrayCommitHandler } from '../shared/array-commit-handler';
import { sameArrayContents } from '../shared/compare';
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
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
} from '../shared/select-core';
import {
  CngxComboboxChip,
  type CngxComboboxChipContext,
  CngxComboboxTriggerLabel,
  type CngxComboboxTriggerLabelContext,
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
 * Change event emitted by {@link CngxCombobox.selectionChange}.
 *
 * @category forms/select/combobox
 */
export interface CngxComboboxChange<T = unknown> {
  readonly source: CngxCombobox<T>;
  readonly values: readonly T[];
  /**
   * Values before the change committed. Populated on commit-success,
   * direct-pick / removal / clear, and Backspace-on-empty paths.
   * Plural matches `CngxMultiSelectChange.previousValues`.
   */
  readonly previousValues?: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear';
}

/**
 * Tag-input style multi-value combobox. Inline `<input role="combobox">`
 * next to a chip strip; typing filters the panel live, Backspace-on-empty
 * removes the trailing chip.
 *
 * Stateless graph in {@link createSelectCore}; this component is a
 * thin adapter binding the trigger template to the core's signals plus
 * value-shape write-paths (AD dispatch, Field↔sync, search filter).
 *
 * @category forms/select/combobox
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/combobox/combobox.component.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxTypeahead, CngxSelect, CngxTreeSelect, CngxComboboxChip
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/combobox/combobox-basic-tag-picker-with-typeahead-filter</example-url>
 * <example-url>http://localhost:4200/#/forms/select/combobox/combobox-clearable-custom-cngxselectclearbutton</example-url>
 * <example-url>http://localhost:4200/#/forms/select/combobox/combobox-text-summary-via-cngxcomboboxtriggerlabel</example-url>
 */
@Component({
  selector: 'cngx-combobox',
  exportAs: 'cngxCombobox',
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
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxCombobox },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxCombobox);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxCombobox },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxCombobox },
  ],
  host: {
    class: 'cngx-combobox',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  templateUrl: './combobox.component.html',
  styleUrls: ['../shared/select-base.css', './combobox.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxCombobox<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

  /** Accessible label for the listbox region and fallback trigger name. */
  readonly label = input<string>('');

  /** Options in data-driven mode (flat or grouped). */
  readonly options = input<CngxSelectOptionsInput<T>>([] as CngxSelectOptionsInput<T>);

  /** Placeholder rendered inside the input when nothing is selected. */
  readonly placeholder = input<string>('');

  /** Disabled state. Merges with `presenter.disabled()`. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Required state. Merges with `presenter.required()`. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** Equality function used to match values to options. Defaults to `Object.is`. */
  readonly compareWith = input<CngxSelectCompareFn<T>>(
    cngxSelectDefaultCompare as CngxSelectCompareFn<T>,
  );

  /** Custom id. Defaults to the presenter-generated ID inside form-field. */
  readonly idInput = input<string | null>(null, { alias: 'id' });

  /** Explicit `aria-label` on the trigger. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Explicit `aria-labelledby` on the trigger. */
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Tab index on the inner `<input>`. Defaults to `0`. */
  readonly tabIndex = input<number>(0);

  /** One-shot autofocus on first render. */
  readonly autofocus = input<boolean>(false);

  /** Classes applied to the panel root. Merged with the library default. */
  readonly panelClass = input<string | readonly string[] | null>(null);

  /** Panel width strategy. */
  readonly panelWidth = input<'trigger' | number | null>(this.config.panelWidth);
  /**
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  /** Mobile `inputmode` attribute. Defaults from `CngxSelectConfig.inputMode`. */
  readonly inputMode = input<NonNullable<CngxSelectConfig['inputMode']>>(this.config.inputMode);
  /**
   * Mobile `enterkeyhint`. Default `'enter'` - Combobox commits Enter
   * without closing the panel.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'enter',
  );
  /** Chip-strip overflow strategy. See `CngxSelectConfig.chipOverflow`. */
  readonly chipOverflow = input<NonNullable<CngxSelectConfig['chipOverflow']>>(
    this.config.chipOverflow,
  );
  /** Max chips in `'truncate'` mode. */
  readonly maxVisibleChips = input<number>(this.config.maxVisibleChips);

  /**
   * Whether activating an option closes the panel. Default `false`
   * (tag-input UX).
   */
  readonly closeOnSelect = input<boolean>(false);

  /** Custom matcher for the inline `CngxListboxSearch`. */
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);

  /** Debounce for search term updates (ms). */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);

  /** Suppress the first `searchTermChange` emission (hydrate-time `''`). */
  readonly skipInitial = input<boolean>(false);

  /** Hide the default in-panel checkmark. */
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);

  /** Indicator position. `null` → inherit config. */
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);

  /** Indicator variant. `null` → inherit config. */
  readonly selectionIndicatorVariant = input<CngxSelectSelectionIndicatorVariant | null>(null);

  /** Hide the default dropdown caret. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /**
   * Replaces the built-in `✕` glyph inside the default clear-all button.
   * Ignored when `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in `▾` caret glyph. Ignored when
   * `*cngxSelectCaret` is projected.
   */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);

  /** Render a clear-all button when at least one value is selected. */
  readonly clearable = input<boolean>(false);

  /** A11y label for the clear-all button. */
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Reset selection',
  );

  /** A11y label prefix for the per-chip remove button. */
  readonly chipRemoveAriaLabel = input<string>(this.config.ariaLabels?.chipRemove ?? 'Remove');

  /** Loading state inside the panel. */
  readonly loading = input<boolean>(false);

  /** First-load indicator variant. */
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);

  /** Skeleton-row count when `loadingVariant === 'skeleton'`. */
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);

  /** Subsequent-load ("refreshing") indicator variant. */
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);

  /** Async-state source for options. */
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);

  /** Callback invoked when the user clicks the default retry button. */
  readonly retryFn = input<(() => void) | null>(null);

  /** Async write handler invoked per toggle. */
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);

  /** Commit UX mode. */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');

  /** Where `commitAction` errors render without a `*cngxSelectCommitError` template. */
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(this.config.commitErrorDisplay);

  /** Per-instance announcer override. */
  readonly announceChanges = input<boolean | null>(null);

  /** Per-instance formatter override. */
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  /** Two-way multi-value binding. */
  readonly values = model<T[]>([]);

  readonly selectionChange = output<CngxComboboxChange<T>>();
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
  private readonly chipDirective = contentChild<CngxComboboxChip<T>>(CngxComboboxChip);
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
  /** Combobox-specific trigger-label slot. @internal */
  protected readonly triggerLabelTpl = computed<TemplateRef<
    CngxComboboxTriggerLabelContext<T>
  > | null>(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** Combobox-specific per-chip slot. @internal */
  protected readonly chipTpl = computed<TemplateRef<CngxComboboxChipContext<T>> | null>(
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

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** Active-descendant id forwarded to the input's `aria-activedescendant`. */
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);

  /** Debounced search term. */
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

  /**
   * Filter overlay bound to the inline search term. `null` on empty
   * term (core short-circuits to unfiltered) and on first render
   * before `viewChild` resolves.
   *
   * @internal
   */
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

  /**
   * Family-shared signal graph. Owns ARIA, panel view, option model,
   * commit-controller surface, announcer.
   *
   * @internal
   */
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

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal - latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal - errorContext signal (wired once with the retry handler). */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal - commitErrorContext signal (wired once with retry handler). */
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
      // Resolve selected values against the UNFILTERED option merge so
      // chips for previously-picked values remain visible when the
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

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /** Tracks whether the first `searchTermChange` emission has been processed. */
  private readonly hasEmittedInitial = signal(false);

  /**
   * Commit-flow handler. Owns commit-controller lifecycle, value
   * reconciliation, rollback-on-error, live-region announce. Shared
   * with `CngxMultiSelect`.
   */
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
   * Chip-removal handler. Disabled-guard + snapshot + filter +
   * commit/sync branch + WeakMap closure cache. Same factory as
   * `CngxMultiSelect`.
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

  /** @internal */ protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */ protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */ protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */ protected readonly isCommittingOption =
    this.core.panelHostAdapter.isCommittingOption;

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

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

    // Lifecycle + routing in createADActivationDispatcher; the array-shape
    // toggle stays inline because it needs the local compareWith snapshot.
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
        // Listbox already wrote through [(values)]; invert the toggle to
        // recover the pre-mutation snapshot.
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

  /** @internal - wrapper click routes focus into the input and opens. */
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

  /** @internal */
  protected handleRetry(): void {
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** @internal */
  protected handleChipRemoveClick(event: Event, opt: CngxSelectOptionDef<T>): void {
    event.stopPropagation();
    this.chipRemovalHandler.removeByValue(opt);
  }

  /**
   * @internal - invoked by `CngxListboxTrigger`'s `(backspaceOnEmpty)`.
   * Routes through the same commit-aware path as chip ✕.
   */
  protected removeLastChip(): void {
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return;
    }
    this.chipRemovalHandler.removeByValue(selected[selected.length - 1]);
  }

  /** @internal */
  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAllCallback();
  }

  /** @internal - imperative clear-all used by slot + default button. */
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

  /** @internal */
  protected handleFocus(): void {
    this.focusState.markFocused();
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusState.markBlurred();
    this.presenter?.fieldState().markAsTouched();
  }

  /** @internal - PageUp/PageDown shared behaviour (±10 option jump). */
  protected handleInputKeydown(event: KeyboardEvent): void {
    handlePageJumpKey(event, {
      listbox: this.listboxRef(),
      popover: this.popoverRef(),
    });
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
