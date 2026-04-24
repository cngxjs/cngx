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
import {
  CNGX_DISPLAY_BINDING_FACTORY,
  type DisplayBinding,
} from '../shared/display-binding';
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
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { resolveSelectConfig } from '../shared/resolve-config';
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
 * @category interactive
 */
export interface CngxTypeaheadChange<T = unknown> {
  readonly source: CngxTypeahead<T>;
  readonly value: T | undefined;
  /**
   * Value before the change was committed. Populated from the pre-pick
   * snapshot captured in the AD-activation callback, from the
   * commit-controller's rollback target on success/error, and from the
   * pre-clear value in the clear path. `undefined` back-compat default
   * for callers on older change-event shapes.
   */
  readonly previousValue?: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Single-value async autocomplete. Fourth sibling of the select family
 * after {@link CngxSelect} (single), {@link CngxMultiSelect} (multi) and
 * {@link CngxCombobox} (multi-chip). Inline `<input role="combobox">`
 * with `aria-autocomplete="list"` — typing filters the panel live and
 * picking commits a single value; the input text is driven by
 * {@link CngxTypeahead.displayWith} so the formatted selection survives
 * blur/refocus. `clearOnBlur` restores the last-committed display on
 * stray keystrokes that never resolved to a pick.
 *
 * Stateless derivations (ARIA projection, option model, panel view,
 * commit-controller surface) live in `shared/select-core.ts` — this
 * component is a thin scalar-value adapter on top.
 *
 * @category interactive
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
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    @let aria = triggerAria();
    <div
      class="cngx-typeahead__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      <div class="cngx-typeahead__trigger" (click)="handleWrapperClick()">
        @if (inputPrefixTpl(); as prefixTpl) {
          <span class="cngx-typeahead__prefix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="prefixTpl; context: inputSlotContext()" />
          </span>
        }
        <input
          #searchInput="cngxListboxSearch"
          #inputEl
          cngxListboxSearch
          type="text"
          class="cngx-typeahead__input"
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
          [closeOnSelect]="true"
          [disabled]="disabled()"
          [placeholder]="placeholder()"
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
        />
        @if (inputSuffixTpl(); as suffixTpl) {
          <span class="cngx-typeahead__suffix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="suffixTpl; context: inputSlotContext()" />
          </span>
        }
        @if (clearable() && value() !== undefined && !disabled()) {
          @if (tpl.clearButton(); as clearBtnTpl) {
            <span class="cngx-typeahead__clear-slot" (click)="$event.stopPropagation()">
              <ng-container
                *ngTemplateOutlet="
                  clearBtnTpl;
                  context: { $implicit: clearCallback, clear: clearCallback, disabled: disabled() }
                "
              />
            </span>
          } @else {
            <button
              type="button"
              class="cngx-typeahead__clear"
              [attr.aria-label]="clearButtonAriaLabel()"
              (click)="handleClearClick($event)"
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
            <ng-container *ngTemplateOutlet="caretT; context: { $implicit: panelOpen(), open: panelOpen() }" />
          } @else if (caretGlyph(); as glyph) {
            <span aria-hidden="true" class="cngx-typeahead__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-typeahead__caret">&#9662;</span>
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
          [compareWith]="listboxCompareWith()"
          [externalActivation]="externalActivation()"
          [explicitOptions]="panelRef.options()"
          [items]="panelRef.items()"
        >
          <cngx-select-panel #panelRef="cngxSelectPanel" />
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './typeahead.component.css'],
})
export class CngxTypeahead<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

  // ── Inputs ─────────────────────────────────────────────────────────

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
   * Popover placement relative to the trigger. Per-instance input
   * wins over {@link CngxSelectConfig.popoverPlacement}.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  /** Formatter from value to input text. Defaults to `String(v)`. */
  readonly displayWith = input<(value: T) => string>((v) => String(v));
  /** When `true` (default), blur without a valid pick resets the input text to `displayWith(value())`. */
  readonly clearOnBlur = input<boolean>(true);
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);
  readonly skipInitial = input<boolean>(false);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Auswahl zurücksetzen',
  );
  /**
   * Replaces the built-in `✕` glyph inside the default clear button
   * while keeping the button frame, ARIA wiring, and click handler
   * intact. When `*cngxSelectClearButton` is also projected, the
   * projected template takes full precedence and this input is ignored.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in `▾` caret glyph while keeping the wrapping
   * span semantics (aria-hidden, class). When `*cngxSelectCaret` is
   * projected, it takes full precedence and this input is ignored.
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
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);
  /**
   * Scalar-commit error-announce policy. Per-instance input wins over
   * {@link CngxSelectConfig.commitErrorAnnouncePolicy}; when neither
   * is set, the variant's shipped default of `{ kind: 'soft' }`
   * applies (typeahead UX shouldn't interrupt the user's free-text
   * flow with assertive reads on commit rollback).
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'soft' },
  );

  /** Two-way single-value binding. */
  readonly value = model<T | undefined>(undefined);

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxTypeaheadChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();
  readonly searchTermChange = output<string>();

  // ── Content-child directive queries ────────────────────────────────

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(CngxSelectOptgroupTemplate);
  private readonly placeholderDirective = contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(CngxSelectOptionLabel);
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly refreshingDirective = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective = contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly clearButtonDirective = contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective = contentChild<CngxSelectOptionPending<T>>(CngxSelectOptionPending);
  private readonly optionErrorDirective = contentChild<CngxSelectOptionError<T>>(CngxSelectOptionError);
  private readonly inputPrefixDirective = contentChild<CngxSelectInputPrefix>(CngxSelectInputPrefix);
  private readonly inputSuffixDirective = contentChild<CngxSelectInputSuffix>(CngxSelectInputSuffix);

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
  });
  /** @internal */ protected readonly inputPrefixTpl = computed<TemplateRef<CngxSelectInputSlotContext> | null>(
    () => this.inputPrefixDirective()?.templateRef ?? null,
  );
  /** @internal */ protected readonly inputSuffixTpl = computed<TemplateRef<CngxSelectInputSlotContext> | null>(
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

  /** Filter overlay applied by `createSelectCore` when the search term is non-empty. */
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

  // ── Local-items buffer (quick-create persistence) ──────────────────

  /** @internal */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(
    this.compareWith,
  );

  // ── Action-slot bridge ──────────────────────────────────────────────

  /** @internal */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
  });
  /** @internal */ readonly actionDirty = this.actionBridge.dirty;
  /** @internal */ readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */ readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;

  // ── Core (stateless signal graph) ──────────────────────────────────

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
   * Append a pre-built option to the component's persistent local
   * buffer — renders in the next panel emission and silently drops
   * once the server state includes a matching value. Dedup-guarded
   * by `compareWith`; duplicate patches are no-ops.
   *
   * @category interactive
   */
  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

  /**
   * Reset the local buffer. Idempotent.
   *
   * @category interactive
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
  /** @internal */ protected readonly resolvedId = this.core.resolvedId;
  /** @internal */ protected readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  /** @internal */ protected readonly resolvedShowSelectionIndicator = this.core.resolvedShowSelectionIndicator;
  /** @internal */ protected readonly resolvedSelectionIndicatorVariant = this.core.resolvedSelectionIndicatorVariant;
  /** @internal */ protected readonly resolvedSelectionIndicatorPosition = this.core.resolvedSelectionIndicatorPosition;
  /** @internal */ protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */ protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly ariaReadonly = this.core.ariaReadonly;
  /** @internal */ protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */ protected readonly externalActivation = this.core.externalActivation;
  /** @internal */ protected readonly showCommitError = this.core.showCommitError;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  /** @internal — reactive context for the input prefix/suffix template outlets. */
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
  readonly isCommitting = this.core.isCommitting;
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

  /**
   * Currently selected option, resolved against `options`. Structurally
   * compared — a fresh OptionDef reference carrying the same `.value`
   * under `compareWith` is treated as equal, so downstream consumer
   * bindings don't re-render when the options array is re-emitted for
   * an unchanged selection (server-driven refetch).
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

  // ── Single-selection state (commit + rollback) ─────────────────────

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
   * Display binding — owns the value ↔ input-text reconciliation cycle
   * (including `writingFromValue` flag, skipInitial-aware
   * `searchTermChange` forwarding, and the imperative
   * `writeFromValue` seed). Resolved via `CNGX_DISPLAY_BINDING_FACTORY`
   * so consumers can wrap the default with telemetry / audit logging /
   * alternative search-term reset policies without forking the
   * component.
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
   * Shared scalar commit handler. Typeahead-specific wrinkles ride the
   * callbacks: `onValueWrite` mirrors the committed/rollback value into
   * the `<input>` via the display binding; `onCommitFinalize` emits
   * `selectionChange` only when the option resolved (preserves the
   * pre-extraction behaviour where unknown-value commits silently
   * dropped the change event — typeahead can't reasonably describe the
   * pick to AT when the option isn't in the loaded set).
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
    return this.value() === undefined;
  }

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
      // Seed input text from the initial value.
      this.display.writeFromValue(this.value());
    });

    // Bridge AD activations into selectionChange + commit flow. closeOnSelect
    // is true — picking a suggestion hides the panel and seeds the input.
    createADActivationDispatcher<T, T>({
      listboxRef: this.listboxRef,
      core: this.core,
      popoverRef: this.popoverRef,
      closeOnSelect: true,
      commitAction: this.commitAction,
      onCommit: (intended, opt) =>
        this.scalarHandler.dispatchFromActivation(intended, opt),
      onActivate: (intended, opt) => {
        const previous = untracked(() => this.value());
        this.scalarHandler.finalizeSelection(intended, opt, previous);
      },
    });

    // Panel open/close lifecycle.
    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.inputEl,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
    });

    // Field↔Component bidirectional sync.
    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) => (this.compareWith() as CngxSelectCompareFn<unknown>)(a, b),
      coerceFromField: (x) => x as T | undefined,
    });

    // Search-term effects: auto-open on typing. `autoOpenGate` blocks
    // the open during library-authored writes (display-binding seed,
    // commit reconciliation, blur restore) so those internal writes
    // don't re-open a panel the user just closed. The emit path is
    // owned by the display binding's `onUserSearchTerm` callback, so
    // `emit` is deliberately left undefined here.
    inject(CNGX_SEARCH_EFFECTS_FACTORY)({
      searchTerm: this.searchTerm,
      panelOpen: this.panelOpen,
      disabled: this.disabled,
      open: () => this.open(),
      autoOpenGate: () => !this.display.isWritingFromValue(),
    });
  }

  // ── Public API ─────────────────────────────────────────────────────

  open(): void { this.popoverRef()?.show(); }
  close(): void { this.popoverRef()?.hide(); }
  toggle(): void { this.popoverRef()?.toggle(); }
  focus(options?: FocusOptions): void { this.inputEl()?.nativeElement.focus(options); }

  // ── Event handlers ─────────────────────────────────────────────────

  protected handleWrapperClick(): void {
    if (this.disabled()) {
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
    if ((mode === 'outside' || mode === 'both') && this.popoverRef()?.isVisible()) {
      this.close();
    }
  }

  protected handleRetry(): void {
    const fn = this.retryFn();
    if (fn) { fn(); }
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
    // clearOnBlur: if the current input text doesn't match `displayWith(value)`,
    // snap back. Disable by setting `[clearOnBlur]="false"`.
    if (this.clearOnBlur()) {
      this.display.writeFromValue(this.value());
    }
  }

  // ── Commit / selection finalize ────────────────────────────────────
  //
  // beginCommit / finalizeSelection / retryCommit were extracted into
  // `createScalarCommitHandler` (shared/scalar-commit-handler.ts).
}
