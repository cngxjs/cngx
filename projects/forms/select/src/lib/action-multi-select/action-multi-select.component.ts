import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
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

import { CngxSelectPanel } from '../shared/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import {
  createArrayCommitHandler,
  type ArrayCommitHandler,
} from '../shared/array-commit-handler';
import { sameArrayContents } from '../shared/compare';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitErrorDisplay,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import { CNGX_SELECT_COMMIT_CONTROLLER_FACTORY } from '../shared/commit-controller';
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
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_SELECT_PANEL_HOST, CNGX_SELECT_PANEL_VIEW_HOST } from '../shared/panel-host';
import { resolveActionSelectConfig } from '../shared/action-select-config';
import { resolveSelectConfig } from '../shared/resolve-config';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
} from '../shared/select-core';
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
 * The `action` discriminant mirrors the flat multi-select family plus
 * the new `'create'` branch — when fired, `added` carries exactly the
 * one freshly-created value and `removed` is empty, so a consumer
 * aggregating deltas across commits treats a create identically to a
 * toggle-add.
 *
 * @category interactive
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
 * Multi-value combobox with inline quick-create. Eighth sibling of the
 * select family — parallels {@link CngxCombobox}'s chip-strip + inline
 * search surface but extends the action-slot protocol established by
 * CngxActionSelect (Commit 5): the `*cngxSelectAction` template's
 * `commit()` callback routes through the shared
 * {@link CreateCommitHandler} to materialise a new `T`, patches the
 * persistent local buffer, appends the new value to the current
 * `values` array, and emits `selectionChange` with
 * `action: 'create'` + `added: [newValue]`.
 *
 * `closeOnCreate` defaults to `false` — multi-pick UX keeps the panel
 * open after each create so consumers can continue adding. The
 * commit-controller's supersede guard still applies: rapid consecutive
 * creates tear down the previous subscription cleanly.
 *
 * Dismiss-guard protocol (from Commit 4) applies identically: Escape
 * and click-outside are intercepted while `actionDirty()` is `true`,
 * shell-level Escape fires `cancel()` through the bridge.
 *
 * @category interactive
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
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-action-multi-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      <!--
        WAI-ARIA 1.2 combobox pattern — focusable element is the inner
        <input role="combobox">. Wrapper carries role="group" so AT
        reads chip-strip + input + action workflow as one widget.
      -->
      @let aria = triggerAria();
      <div
        class="cngx-action-multi-select__trigger"
        role="group"
        [attr.aria-label]="aria.label"
        [attr.aria-labelledby]="aria.labelledBy"
        [attr.aria-disabled]="aria.disabled"
        (click)="handleWrapperClick($event)"
      >
        @if (triggerLabelTpl(); as triggerTpl) {
          <span class="cngx-select__chip-list cngx-action-multi-select__trigger-label">
            <ng-container
              *ngTemplateOutlet="
                triggerTpl;
                context: {
                  $implicit: selectedOptions(),
                  selected: selectedOptions(),
                  values: values(),
                  count: selectedOptions().length
                }
              "
            />
          </span>
        } @else if (!isEmpty()) {
          <span class="cngx-select__chip-list">
            @for (opt of selectedOptions(); track opt.value) {
              @if (chipTpl(); as tpl) {
                <ng-container
                  *ngTemplateOutlet="
                    tpl;
                    context: { $implicit: opt, option: opt, remove: chipRemoveFor(opt) }
                  "
                />
              } @else {
                <cngx-chip
                  [removable]="!disabled()"
                  [removeAriaLabel]="chipRemoveAriaLabel() + ': ' + opt.label"
                  (remove)="handleChipRemoveClick($event, opt)"
                >
                  {{ opt.label }}
                </cngx-chip>
              }
            }
          </span>
        }
        @if (inputPrefixTpl(); as prefixTpl) {
          <span class="cngx-action-multi-select__prefix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="prefixTpl; context: inputSlotContext()" />
          </span>
        }
        <input
          #searchInput="cngxListboxSearch"
          #inputEl
          cngxListboxSearch
          type="text"
          class="cngx-action-multi-select__input"
          role="combobox"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          [matchFn]="effectiveMatchFn()"
          [debounceMs]="searchDebounceMs()"
          [cngxPopoverTrigger]="pop"
          [haspopup]="'listbox'"
          [cngxListboxTrigger]="lb"
          [popover]="pop"
          [closeOnSelect]="false"
          [disabled]="disabled()"
          [placeholder]="effectivePlaceholder()"
          [attr.id]="resolvedId() || null"
          [attr.tabindex]="effectiveTabIndex()"
          [attr.aria-expanded]="aria.expanded"
          [attr.aria-controls]="pop.id()"
          [attr.aria-autocomplete]="'list'"
          [attr.aria-activedescendant]="activeId()"
          [attr.aria-describedby]="aria.describedBy"
          [attr.aria-errormessage]="aria.errorMessage"
          [attr.aria-invalid]="aria.invalid"
          [attr.aria-required]="aria.required"
          [attr.aria-busy]="aria.busy"
          (focus)="handleFocus()"
          (blur)="handleBlur()"
          (backspaceOnEmpty)="removeLastChip()"
          (keydown.enter)="handleTriggerEnter($event)"
        />
        @if (inputSuffixTpl(); as suffixTpl) {
          <span class="cngx-action-multi-select__suffix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="suffixTpl; context: inputSlotContext()" />
          </span>
        }
        @if (clearable() && !isEmpty() && !disabled()) {
          @if (tpl.clearButton(); as clearBtnTpl) {
            <span class="cngx-action-multi-select__clear-slot" (click)="$event.stopPropagation()">
              <ng-container
                *ngTemplateOutlet="
                  clearBtnTpl;
                  context: {
                    $implicit: clearAllCallback,
                    clear: clearAllCallback,
                    disabled: disabled()
                  }
                "
              />
            </span>
          } @else {
            <button
              type="button"
              class="cngx-action-multi-select__clear-all"
              [attr.aria-label]="clearButtonAriaLabel()"
              (click)="handleClearAllClick($event)"
            >
              @if (clearGlyph(); as glyph) {
                <ng-container *ngTemplateOutlet="glyph" />
              } @else {
                <span aria-hidden="true">✕</span>
              }
            </button>
          }
        }
        @if (resolvedShowCaret()) {
          @if (tpl.caret(); as caretT) {
            <ng-container
              *ngTemplateOutlet="caretT; context: { $implicit: panelOpen(), open: panelOpen() }"
            />
          } @else if (caretGlyph(); as glyph) {
            <span aria-hidden="true" class="cngx-action-multi-select__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-action-multi-select__caret">&#9662;</span>
          }
        }
      </div>
      <div
        cngxPopover
        #pop="cngxPopover"
        [placement]="popoverPlacement()"
        class="cngx-select__panel"
        [class]="panelClassList()"
        [style.--cngx-select-panel-min-width]="panelWidthCss()"
      >
        <div
          cngxListbox
          #lb="cngxListbox"
          [label]="resolvedListboxLabel()"
          [multiple]="true"
          [compareWith]="listboxCompareWith()"
          [externalActivation]="externalActivation()"
          [explicitOptions]="panelRef.options()"
          [items]="panelRef.items()"
          [(selectedValues)]="values"
        >
          <cngx-select-panel #panelRef="cngxSelectPanel" />
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './action-multi-select.component.css'],
})
export class CngxActionMultiSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();
  private readonly actionConfig = resolveActionSelectConfig();

  // ── Inputs (mirror CngxCombobox) ───────────────────────────────────

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
  /** Debounce for the inline search. Defaults to `0` — instant feedback in the action slot. */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);
  readonly skipInitial = input<boolean>(false);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Auswahl zurücksetzen',
  );
  readonly chipRemoveAriaLabel = input<string>(
    this.config.ariaLabels?.chipRemove ?? 'Entfernen',
  );
  readonly loading = input<boolean>(false);
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);
  readonly retryFn = input<(() => void) | null>(null);
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  // ── Action-multi-select specific inputs ────────────────────────────

  /**
   * Quick-create handler. `null` (default) disables the create path —
   * consumer templates can still render the slot as branding / static
   * CTA, and clicking `commit()` becomes a silent no-op.
   */
  readonly quickCreateAction = input<CngxSelectCreateAction<T> | null>(null);
  /**
   * Whether a successful create closes the panel. Defaults to `false`
   * — multi-pick UX keeps the panel open so consumers can continue
   * adding without re-opening. Set `true` for confirm-to-create
   * workflows where each create is a discrete transaction.
   */
  readonly closeOnCreate = input<boolean>(this.actionConfig.closeOnCreate ?? false);
  /**
   * Whether the organism falls back to the raw `<input>` value when
   * the debounced `searchTerm` hasn't caught up yet. Default derived
   * from {@link CngxActionSelectConfig.liveInputFallback} (app-wide
   * default `true`).
   */
  readonly liveInputFallback = input<boolean>(this.actionConfig.liveInputFallback);
  /**
   * Position of the `*cngxSelectAction` slot within the panel frame.
   * Forwarded through the shared view-host contract into
   * `CngxSelectPanelShell.actionPosition`. Defaults to `'bottom'`.
   */
  readonly actionPosition = input<'top' | 'bottom' | 'both' | 'none'>(
    this.actionConfig.actionPosition,
  );
  /**
   * Popover placement relative to the trigger. Per-instance input
   * wins over {@link CngxActionSelectConfig.popoverPlacement} — app
   * default `'bottom'` if neither is set.
   */
  readonly popoverPlacement = input<PopoverPlacement>(
    this.actionConfig.popoverPlacement,
  );

  /** Two-way multi-value binding. */
  readonly values = model<T[]>([]);

  // ── Outputs ────────────────────────────────────────────────────────

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
  /**
   * Dedicated channel for successful quick-creates. Fires after
   * `selectionChange` with the same option payload.
   */
  readonly created = output<CngxSelectOptionDef<T>>();

  // ── Content-child directive queries ────────────────────────────────

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective = contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly triggerLabelDirective = contentChild<CngxComboboxTriggerLabel<T>>(
    CngxComboboxTriggerLabel,
  );
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(CngxSelectOptionLabel);
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly refreshingDirective = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective = contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly chipDirective = contentChild<CngxMultiSelectChip<T>>(CngxMultiSelectChip);
  private readonly clearButtonDirective = contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective = contentChild<CngxSelectOptionPending<T>>(CngxSelectOptionPending);
  private readonly optionErrorDirective = contentChild<CngxSelectOptionError<T>>(CngxSelectOptionError);
  private readonly inputPrefixDirective = contentChild<CngxSelectInputPrefix>(CngxSelectInputPrefix);
  private readonly inputSuffixDirective = contentChild<CngxSelectInputSuffix>(CngxSelectInputSuffix);
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
    refreshing: this.refreshingDirective,
    commitError: this.commitErrorDirective,
    clearButton: this.clearButtonDirective,
    optionPending: this.optionPendingDirective,
    optionError: this.optionErrorDirective,
    action: this.actionDirective,
  });
  /** @internal */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxComboboxTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);
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

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly searchInputRef = viewChild(CngxListboxSearch);
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);
  readonly searchTerm: Signal<string> = computed(() => this.searchInputRef()?.term() ?? '');

  // ── CngxFormFieldControl ───────────────────────────────────────────

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
    return (all) => filterSelectOptions(all, term, matcher);
  });

  // ── Local-items buffer ─────────────────────────────────────────────

  /** @internal */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(
    this.compareWith,
  );

  // ── Action-slot bridge (commit routes through create handler) ──────

  /**
   * Dedicated commit controller for the quick-create flow. The
   * component's toggle/clear path runs through `core.commitController`
   * (typed `CngxCommitController<T[]>` because array-commit-handler
   * reconciles the full values array). A create materialises a
   * single `T`, so it needs a controller parameterised on `T`, not
   * `T[]`. Keeping the two controllers separate also preserves each
   * path's supersede semantics — a create in flight doesn't cancel
   * a pending toggle and vice versa.
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
   * View-host signal the shared panel shell reads when building the
   * `*cngxSelectAction` context's `$implicit` + `searchTerm` fields.
   *
   * @internal
   */
  readonly actionSearchTerm = this.searchTerm;
  /**
   * View-host signal feeding the action context's `error` + `hasError`
   * fields. Multi-select uses a dedicated `createCommitController<T>`
   * for the quick-create lifecycle (independent of the array-typed
   * toggle/clear controller on `core.commitController`), so the
   * action-slot error surface reflects create failures only — toggle
   * errors still flow through the shell's own commit-error banner.
   *
   * @internal
   */
  readonly actionError = computed<unknown>(() =>
    this.createCommitController.state.error(),
  );
  /**
   * View-host signal feeding the action context's `value` field —
   * forwards the component's live values array so in-panel mini-forms
   * can read the current selection without re-injecting.
   *
   * @internal
   */
  readonly actionValue = computed<unknown>(() => this.values());

  // ── Core (stateless signal graph) ──────────────────────────────────

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

  /** @category interactive */
  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

  /** @category interactive */
  clearLocalItems(): void {
    this.localItemsBuffer.clear();
  }

  // ── Template-facing protected surface ──────────────────────────────

  /** @internal */ protected readonly effectiveOptions = this.core.effectiveOptions;
  /** @internal */ protected readonly flatOptions = this.core.flatOptions;
  /** @internal */ protected readonly activeView = this.core.activeView;
  /** @internal */ protected readonly showRefreshIndicator = this.core.showRefreshIndicator;
  /** @internal */ protected readonly showInlineError = this.core.showInlineError;
  /** @internal */ protected readonly skeletonIndices = this.core.skeletonIndices;
  /** @internal */ protected readonly panelClassList = this.core.panelClassList;
  /** @internal */ protected readonly panelWidthCss = this.core.panelWidthCss;
  /** @internal */ protected readonly resolvedId = this.core.resolvedId;
  /** @internal */ protected readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  /** @internal */ protected readonly resolvedShowSelectionIndicator =
    this.core.resolvedShowSelectionIndicator;
  /** @internal */ protected readonly resolvedSelectionIndicatorVariant =
    this.core.resolvedSelectionIndicatorVariant;
  /** @internal */ protected readonly resolvedSelectionIndicatorPosition =
    this.core.resolvedSelectionIndicatorPosition;
  /** @internal */ protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */ protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly ariaReadonly = this.core.ariaReadonly;
  /** @internal */ protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */ protected readonly externalActivation = this.core.externalActivation;
  /** @internal */ protected readonly showCommitError = this.core.showCommitError;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  /** @internal */
  protected readonly inputSlotContext = computed<CngxSelectInputSlotContext>(
    () => ({ disabled: this.disabled(), focused: this.focused(), panelOpen: this.panelOpen() }),
    {
      equal: (a, b) =>
        a.disabled === b.disabled &&
        a.focused === b.focused &&
        a.panelOpen === b.panelOpen,
    },
  );

  readonly commitState = this.core.commitState;
  /**
   * `true` while EITHER the toggle/clear commit or the quick-create
   * commit is pending. The two run on separate controllers (toggle
   * reconciles `T[]`; create materialises a single `T`) but a consumer
   * observing "is any write in flight?" gets a single truthy signal.
   */
  readonly isCommitting = computed<boolean>(
    () => this.core.isCommitting() || this.createCommitController.isCommitting(),
  );
  /** @internal */ readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => this.commitHandler.retryLast());

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

  // ── Multi-selection state ──────────────────────────────────────────

  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      // Chip strip must look up selected values against the UNFILTERED
      // option merge — if the user has typed a filter term that hides
      // previously-picked values from the panel listbox, the chips
      // should still render.
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

  // ── Commit handlers (toggle/clear + create) ────────────────────────

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
   * Shared create-commit handler. Routes every quick-create through
   * the same lifecycle primitive `CngxActionSelect` uses; the
   * `onCreated` callback is where multi-value semantic lives —
   * append-to-values rather than replace.
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
      // Multi-value: append the new value to the array. No dedup —
      // quickCreateAction is intentional and should never collide
      // with an existing selection (the created item is, by
      // definition, freshly materialised).
      const next = [...previousValues, option.value];
      this.values.set(next);
      // Clear the inline search so the user can immediately type the
      // next term. Mirrors tag-input UX — every successful "add" wipes
      // the input. For single-value (`CngxActionSelect`), the input
      // instead shows `displayWith(value)` to reflect the selection.
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
  protected isCommittingOption(opt: CngxSelectOptionDef<T>): boolean {
    return this.core.isCommittingOption(opt);
  }

  protected isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T> {
    return this.core.isGroup(item);
  }

  protected isSelected(opt: CngxSelectOptionDef<T>): boolean {
    return this.core.isSelected(opt.value);
  }

  protected isIndeterminate(opt: CngxSelectOptionDef<T>): boolean {
    return this.core.isIndeterminate(opt.value);
  }

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  private readonly chipRemoveCache = new WeakMap<
    CngxSelectOptionDef<T>,
    () => void
  >();

  /** @internal */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    const cached = this.chipRemoveCache.get(opt);
    if (cached) {
      return cached;
    }
    const fn = (): void => this.removeOption(opt);
    this.chipRemoveCache.set(opt, fn);
    return fn;
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
      coerceFromField: (x) => (Array.isArray(x) ? ([...(x as T[])]) : []),
      toFieldValue: (v) => [...v],
    });

    // Search-term effects: skipInitial-gated emit + auto-open on typing.
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

  // ── Public API ─────────────────────────────────────────────────────

  open(): void { this.popoverRef()?.show(); }
  close(): void { this.popoverRef()?.hide(); }
  toggle(): void { this.popoverRef()?.toggle(); }
  focus(options?: FocusOptions): void { this.inputEl()?.nativeElement.focus(options); }

  // ── Action-slot commit routing ─────────────────────────────────────

  /**
   * Entry point invoked by the action-slot template's `commit()`
   * callback. Resolves an effective draft (falling back to the live
   * `searchTerm` when omitted) and dispatches through the create
   * handler with the current values as previous-snapshot.
   *
   * @internal
   */
  /**
   * Enter on the trigger input fires the quick-create flow when the
   * listbox has no active option AND a quickCreateAction is bound AND
   * the user has typed something. Natural tag-input keyboard UX —
   * type the new tag name, press Enter, a chip appears.
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
   * Live search-term accessor for the create flow. See
   * {@link CngxActionSelect} for the contract — identical behaviour
   * carried over so both organisms honour the same
   * `liveInputFallback` config switch.
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

  // ── Event handlers ─────────────────────────────────────────────────

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

  protected handleClickOutside(): void {
    if (this.actionBridge.shouldBlockDismiss()) {
      return;
    }
    const mode = this.config.dismissOn;
    if (mode === 'outside' || mode === 'both') {
      if (this.popoverRef()?.isVisible()) {
        this.close();
      }
    }
  }

  protected handleRetry(): void {
    const fn = this.retryFn();
    if (fn) { fn(); }
    this.retry.emit();
  }

  protected handleChipRemoveClick(event: Event, opt: CngxSelectOptionDef<T>): void {
    event.stopPropagation();
    this.removeOption(opt);
  }

  /** @internal */
  protected removeLastChip(): void {
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return;
    }
    this.removeOption(selected[selected.length - 1]);
  }

  private removeOption(opt: CngxSelectOptionDef<T>): void {
    if (this.disabled()) {
      return;
    }
    const action = this.commitAction();
    const previous = [...this.values()];
    const eq = this.compareWith();
    const next = previous.filter((v) => !eq(v, opt.value));
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
    this.finalizeToggle(opt, false, previous);
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

  // ── Commit orchestration ───────────────────────────────────────────

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
