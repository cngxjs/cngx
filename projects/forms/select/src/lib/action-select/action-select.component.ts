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
  ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import { CNGX_STATEFUL, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

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
import { CngxSelectAnnouncer } from '../shared/announcer';
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
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import {
  CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  type CreateCommitHandler,
} from '../shared/create-commit-handler';
import type { CngxSelectCreateAction } from '../shared/create-action.types';
import {
  CNGX_DISPLAY_BINDING_FACTORY,
  type DisplayBinding,
} from '../shared/display-binding';
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
import { resolveSelectConfig } from '../shared/resolve-config';
import { handlePageJumpKey } from '../shared/page-jump-handler';
import { setupVirtualization } from '../shared/setup-virtualization';
import { CNGX_SEARCH_EFFECTS_FACTORY } from '../shared/search-effects';
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
import {
  cngxSelectDefaultCompare,
  createSelectCore,
  type CngxSelectCompareFn,
} from '../shared/select-core';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
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
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  type CngxSelectInputSlotContext,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxActionSelect.selectionChange}.
 * The `action` discriminant carries the cause of the change: `'select'`
 * is a normal pick, `'clear'` a reset, `'create'` a successful inline
 * quick-create via the `*cngxSelectAction` slot.
 *
 * @category interactive
 */
export interface CngxActionSelectChange<T = unknown> {
  readonly source: CngxActionSelect<T>;
  readonly value: T | undefined;
  readonly previousValue: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'select' | 'clear' | 'create';
}

/**
 * Single-value autocomplete with inline quick-create. Seventh sibling
 * of the select family after `CngxSelect` (single),
 * `CngxMultiSelect` (multi), `CngxCombobox` (multi-chip),
 * `CngxTypeahead` (single async), `CngxTreeSelect` (tree-multi), and
 * `CngxReorderableMultiSelect` (multi + reorder).
 *
 * Mirrors {@link /projects/forms/select/src/lib/typeahead/typeahead.component.ts
 * CngxTypeahead}'s input surface (inline `<input role="combobox">` with
 * `aria-autocomplete="list"`, `displayWith`, `clearOnBlur`, the
 * `*cngxSelectAction` slot integrates through the shared action-host
 * bridge: the consumer projects a template into the panel, and when
 * the user fires its `commit()` callback the bound
 * {@link CngxSelectCreateAction} materialises a new `T` through the
 * commit controller. On success the handler patches the persistent
 * local buffer with `{ value, label }` — the item stays visible across
 * state refetches until the server has picked it up — writes `value`,
 * announces `'created'`, and optionally closes the panel.
 *
 * Commit semantics are pessimistic: the panel stays open while the
 * handler runs, `isPending` flips in the slot context so a
 * consumer-authored button can render a spinner, and on error the
 * default commit-error banner surfaces above the options. True
 * optimistic UX (insert-before-commit with temp-value) requires a
 * consumer-supplied `tempValueFactory` — deferred to a follow-up per
 * `.internal/architektur/action-select-master-plan.md` §3 Commit 5.
 *
 * Dismiss-guard protocol — Escape and click-outside are intercepted
 * while `actionDirty()` is `true`. A consumer-authored slot flips the
 * flag via the context's `setDirty(true)` callback; the shell-level
 * Escape handler fires `cancel()` (which resets dirty) so the panel
 * does not dismiss mid-workflow.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-action-select',
  exportAs: 'cngxActionSelect',
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
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    @let aria = triggerAria();
    <div
      class="cngx-action-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      <div class="cngx-action-select__trigger" (click)="handleWrapperClick()">
        @if (inputPrefixTpl(); as prefixTpl) {
          <span class="cngx-action-select__prefix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="prefixTpl; context: inputSlotContext()" />
          </span>
        }
        <input
          #searchInput="cngxListboxSearch"
          #inputEl
          cngxListboxSearch
          type="text"
          class="cngx-action-select__input"
          role="combobox"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          [attr.inputmode]="inputMode()"
          [attr.enterkeyhint]="enterKeyHint()"
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
          (blur)="handleBlur($event)"
          (keydown.enter)="handleTriggerEnter($event)"
          (keydown)="handleInputKeydown($event)"
        />
        @if (inputSuffixTpl(); as suffixTpl) {
          <span class="cngx-action-select__suffix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="suffixTpl; context: inputSlotContext()" />
          </span>
        }
        @if (clearable() && value() !== undefined && !disabled()) {
          @if (tpl.clearButton(); as clearBtnTpl) {
            <span class="cngx-action-select__clear-slot" (click)="$event.stopPropagation()">
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
              class="cngx-action-select__clear"
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
            <span aria-hidden="true" class="cngx-action-select__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-action-select__caret">&#9662;</span>
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
          [virtualCount]="virtualItemCount()"
        >
          <cngx-select-panel #panelRef="cngxSelectPanel" />
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './action-select.component.css'],
})
export class CngxActionSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
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
  readonly displayWith = input<(value: T) => string>(String);
  readonly clearOnBlur = input<boolean>(true);
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);
  /**
   * Debounce for the inline search. Defaults to `0` for the action-
   * select organisms — quick-create UX benefits from instant feedback
   * so the slot template's `let-term` reflects every keystroke. Raise
   * via the input for large option lists where filtering every
   * keystroke is measurably slow.
   */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);
  readonly skipInitial = input<boolean>(false);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | 'radio' | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Reset selection',
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
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );
  /**
   * Scalar-commit error-announce policy. Controls whether a failing
   * commit reads the verbatim error message (`'verbose'`) or a soft
   * "selection removed" sentence (`'soft'`). Defaults from
   * {@link CngxSelectConfig.commitErrorAnnouncePolicy} — app-wide
   * default is verbose/assertive; this variant historically announced
   * `'soft'` so its per-instance default stays `'soft'` to preserve
   * back-compat. Override per instance when destructive create flows
   * warrant the louder read.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'soft' },
  );
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  // ── Action-select specific inputs ──────────────────────────────────

  /**
   * Quick-create handler fired by the slot template's `commit()`
   * callback. Receives the live `searchTerm` plus the drafted
   * `{ label }` and resolves to a newly-materialised `T`. `null`
   * (default) disables the create path — the slot template may still
   * render (as a branding cue, static CTA, etc.), and clicking its
   * commit callback becomes a silent no-op.
   */
  readonly quickCreateAction = input<CngxSelectCreateAction<T> | null>(null);
  /**
   * Whether a successful create closes the panel. Defaults to `true` —
   * single-value pick-and-create semantics mirror ordinary selection
   * UX. Set `false` for long flows where the consumer wants to keep
   * the panel open for confirmation, multi-step wizards, etc.
   */
  readonly closeOnCreate = input<boolean>(this.actionConfig.closeOnCreate ?? true);
  /**
   * Whether the organism falls back to the raw `<input>` value when
   * the debounced `searchTerm` hasn't caught up yet. Default derived
   * from {@link CngxActionSelectConfig.liveInputFallback} (app-wide
   * default `true`). Disable when the app owns its own search
   * pipeline and wants create payloads to derive strictly from the
   * bound term.
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
   * default `'bottom'` if neither is set. Accepts any `PopoverPlacement`
   * the `cngxPopover` directive understands.
   */
  readonly popoverPlacement = input<PopoverPlacement>(
    this.actionConfig.popoverPlacement,
  );
  /**
   * Mobile `inputmode` attribute. Defaults from
   * {@link CngxSelectConfig.inputMode} (`'search'`).
   */
  readonly inputMode = input<NonNullable<CngxSelectConfig['inputMode']>>(
    this.config.inputMode,
  );
  /**
   * Mobile `enterkeyhint` attribute. Defaults to `'go'` (ActionSelect
   * Enter routes to quick-create when no AD item is active). App-wide
   * config wins when non-null.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'go',
  );

  /** Two-way single-value binding. */
  readonly value = model<T | undefined>(undefined);

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxActionSelectChange<T>>();
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
   * `selectionChange` with the same option payload so consumers that
   * only care about create events can bind `(created)` without
   * branching on `action === 'create'`.
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
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(CngxSelectOptionLabel);
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDirective =
    contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
  private readonly refreshingDirective = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective = contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
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
    retryButton: this.retryButtonDirective,
    refreshing: this.refreshingDirective,
    commitError: this.commitErrorDirective,
    clearButton: this.clearButtonDirective,
    optionPending: this.optionPendingDirective,
    optionError: this.optionErrorDirective,
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

  // ── Action-slot bridge (routes the commit callback to create) ──────

  /**
   * The bridge's `isPending` tracks the commit controller so the slot
   * template's `isPending` context flag reflects the live create
   * state. Ties the UX feedback (button spinner, disabled state) to
   * the same state-machine that drives the commit-error banner.
   *
   * @internal
   */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
    // `commit` + `retry` both route through methods that resolve
    // `createHandler` lazily. The handler is declared further down in
    // field-init order, so the closures capture `this` here and hit
    // the real handler at call time — well after construction
    // completes.
    commit: (draft) => this.handleActionCommit(draft),
    retry: () => this.createHandler.retryLast(),
    isPending: computed(() => this.core.isCommitting()),
  });
  /** @internal */
  readonly actionDirty = this.actionBridge.dirty;
  /** @internal */
  readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */
  readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;
  /**
   * View-host signal the shared panel shell reads when building the
   * `*cngxSelectAction` context's `$implicit` + `searchTerm` fields.
   * Exposes the component's live search term so the slot template's
   * `let-term` binding reflects what the user is typing in real time.
   *
   * @internal
   */
  readonly actionSearchTerm = this.searchTerm;
  /**
   * View-host signal feeding the action context's `error` + `hasError`
   * fields. Single-select shares one commit controller across both
   * the optional `[commitAction]` path and the inline quick-create
   * path, so `core.commitErrorValue` covers both surfaces — the
   * template's `error` context reflects whichever error was latched
   * last.
   *
   * @internal
   */
  readonly actionError = computed<unknown>(() => this.core.commitErrorValue());
  /**
   * View-host signal feeding the action context's `value` field —
   * forwards the component's live scalar selection so in-panel
   * mini-forms can read the current pick without re-injecting.
   *
   * @internal
   */
  readonly actionValue = computed<unknown>(() => this.value());
  // The `actionPosition` input signal itself satisfies
  // `CngxSelectPanelViewHost.actionPosition?: Signal<...>` — no computed
  // wrapper needed, `InputSignal<T>` is a `Signal<T>`.

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
   * buffer. Used internally by the create-commit handler; exposed
   * publicly so consumers can pre-seed the buffer with recently-used
   * items, "add to history" workflows, etc.
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

  // ── Template-facing protected surface ──────────────────────────────

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
  protected readonly resolvedShowSelectionIndicator =
    this.core.resolvedShowSelectionIndicator;
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
        a.disabled === b.disabled &&
        a.focused === b.focused &&
        a.panelOpen === b.panelOpen,
    },
  );

  readonly commitState = this.core.commitState;
  readonly isCommitting = this.core.isCommitting;
  /** @internal */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

  /** @internal — full virtualisation wire-up (see setupVirtualization). */
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

  private readonly commitController = this.core.commitController;
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly announceCommitError = inject(CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY)({
    deps: {
      announcer: this.announcer,
      commitErrorMessage: (err) => this.core.commitErrorMessage(err),
      softAnnounce: (opt, action, count, multi) =>
        this.core.announce(opt as CngxSelectOptionDef<T> | null, action, count, multi),
    },
    // The input's default mirrors this variant's historical `'soft'`
    // baseline; the announcer reads the live input signal, so app-wide
    // config + per-instance override both flow through identically.
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

  // ── Create-commit handler ──────────────────────────────────────────

  private readonly createHandler: CreateCommitHandler<T, T | undefined> = inject(
    CNGX_CREATE_COMMIT_HANDLER_FACTORY,
  )<T, T | undefined>({
    quickCreateAction: this.quickCreateAction,
    commitController: this.commitController,
    localItemsBuffer: this.localItemsBuffer,
    closeOnSuccess: this.closeOnCreate,
    onCreated: (option, previousValue) => {
      // Handler is value-shape-agnostic — single-value semantic lives
      // here: write `value`, mirror into display, emit 'create'.
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
    onError: (err) => this.commitError.emit(err),
    onClose: () => this.close(),
    onResetDirty: () => this.actionBridge.reset(),
  });

  // ── Panel-host surface forwarding ──────────────────────────────────
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

    // Search-term effects: auto-open on typing. Same gating as
    // CngxTypeahead — the display-binding emits searchTermChange via
    // `onUserSearchTerm`, so the emit path is left undefined here.
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

  // ── Action-slot commit routing ─────────────────────────────────────

  /**
   * Entry point invoked by the action-slot template's `commit()`
   * callback. Resolves an effective draft (falling back to the live
   * `searchTerm` when the consumer omits one) and dispatches through
   * the shared create-commit handler.
   *
   * @internal
   */
  /**
   * Enter on the trigger input. When the listbox has no active item
   * AND a quickCreateAction is bound AND the user has typed something,
   * Enter fires the create flow — natural "type a new value, press
   * Enter to add it" keyboard UX. If there IS an active item,
   * CngxListboxTrigger's own Enter handler already activated it and
   * this path is a no-op.
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

  /** @internal — PageUp/PageDown shared behaviour (±10 option jump). */
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
    const previous = this.value();
    this.createHandler.dispatch(effective, term, previous);
  }

  /**
   * Live search-term accessor for the create flow. When
   * `liveInputFallback` is enabled (default) the getter falls back to
   * the raw `<input>.value` if the debounced `searchTerm` signal
   * hasn't caught up — prevents a fast typist pressing the Create
   * button inside the debounce window from triggering a silent
   * no-op. When disabled the getter returns the bound `searchTerm`
   * verbatim so consumers owning their own debouncing see fully
   * predictable create payloads.
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

  protected handleWrapperClick(): void {
    if (this.disabled()) {
      return;
    }
    this.focus();
    if (!this.panelOpen()) {
      this.open();
    }
  }

  /** @internal — click-outside dismissal (action-dirty-guarded). */
  protected readonly handleClickOutside = inject(CNGX_DISMISS_HANDLER_FACTORY)({
    popoverRef: this.popoverRef,
    dismissOn: this.config.dismissOn,
    shouldBlockDismiss: this.actionBridge.shouldBlockDismiss,
  }).handleClickOutside;

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
      action: 'clear',
    });
    this.core.announce(null, 'removed', 0, false);
  };

  protected handleFocus(): void {
    this.focusState.markFocused();
  }

  protected handleBlur(event?: FocusEvent): void {
    this.focusState.markBlurred();
    this.presenter?.fieldState().markAsTouched();
    if (!this.clearOnBlur()) {
      return;
    }
    // Skip the clear-on-blur write when focus is moving INSIDE the
    // component (e.g. clicking an action-slot button or the clear
    // button). Otherwise the input wipe races the click handler: the
    // blur fires first, writes `displayWith(value)` (or empty if no
    // value yet), and by the time the click handler runs the raw
    // input is already gone — `commit()` silently drops because the
    // draft label is empty.
    const related = event?.relatedTarget as HTMLElement | null;
    if (related && this.isWithinComponent(related)) {
      return;
    }
    this.display.writeFromValue(this.value());
  }

  /**
   * True when the given element is a descendant of the component's
   * host element (includes the popover panel + its action-slot
   * template, because `<div cngxPopover>` lives inside the host
   * template even when rendered in the browser's top-layer — `contains`
   * follows the DOM tree, not the rendering tree).
   *
   * Uses the injected host `ElementRef` rather than a `closest()`
   * query against a hardcoded CSS class so re-skinning the wrapper
   * doesn't silently break the blur-guard behaviour.
   *
   * @internal
   */
  private isWithinComponent(el: HTMLElement): boolean {
    return this.hostEl.nativeElement.contains(el);
  }

  // ── Commit / selection finalize ────────────────────────────────────

  /**
   * Shared scalar-commit factory. Owns the full `beginCommit` /
   * `finalizeSelection` / `retryLast` triad the component previously
   * carried inline. Wired with variant-specific callbacks:
   *
   *   - `onCommitFinalize` emits `selectionChange({ action: 'select' })`
   *     and routes through `core.announce(..., 'added', 1, false)`.
   *   - `onCommitError` delegates to the scalar commit-error announcer
   *     (`soft` policy for this component — matches `CngxTypeahead`).
   *   - `onValueWrite` mirrors the committed value into the input-text
   *     display so the trigger `<input>` stays in sync with `value()`.
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
