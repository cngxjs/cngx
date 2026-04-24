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
  createArrayCommitHandler,
  type ArrayCommitHandler,
} from '../shared/array-commit-handler';
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
} from '../shared/config';
import {
  filterSelectOptions,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { resolveSelectConfig } from '../shared/resolve-config';
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
  CngxComboboxTriggerLabel,
  type CngxComboboxTriggerLabelContext,
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
 * Change event emitted by {@link CngxCombobox.selectionChange}.
 *
 * @category interactive
 */
export interface CngxComboboxChange<T = unknown> {
  readonly source: CngxCombobox<T>;
  readonly values: readonly T[];
  /**
   * Values before the change was committed. Populated on the
   * commit-success path, the direct-pick/removal/clear paths, and the
   * Backspace-on-empty chip-remove path. Plural name matches
   * `CngxMultiSelectChange.previousValues` so consumer templates can
   * share change-event shapes.
   */
  readonly previousValues?: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear';
}

/**
 * Tag-input style multi-value combobox. Third sibling of the select
 * family after {@link CngxSelect} (single) and {@link CngxMultiSelect}
 * (multi). Inline `<input role="combobox">` next to a chip strip;
 * typing filters the panel live and Backspace-on-empty removes the
 * trailing chip.
 *
 * Stateless derivations (ARIA projection, option model, panel view,
 * commit-controller surface) live in `shared/select-core.ts` — this
 * component is a thin adapter binding its own trigger template to the
 * core's signals plus a handful of value-shape-specific write-paths
 * (AD-activated dispatch, Field↔sync, search filter overlay).
 *
 * @category interactive
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
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-combobox__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      <!--
        WAI-ARIA 1.2 combobox pattern.
        Focusable element is the inner <input role="combobox">. Wrapper
        carries role="group" so AT reads the chip-strip + input as one
        widget. Chip × buttons are valid siblings of the input.
      -->
      @let aria = triggerAria();
      <div
        class="cngx-combobox__trigger"
        role="group"
        [attr.aria-label]="aria.label"
        [attr.aria-labelledby]="aria.labelledBy"
        [attr.aria-disabled]="aria.disabled"
        (click)="handleWrapperClick($event)"
      >
        @if (triggerLabelTpl(); as triggerTpl) {
          <span class="cngx-select__chip-list cngx-combobox__trigger-label">
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
              <cngx-chip
                [removable]="!disabled()"
                [removeAriaLabel]="chipRemoveAriaLabel() + ': ' + opt.label"
                (remove)="handleChipRemoveClick($event, opt)"
              >
                {{ opt.label }}
              </cngx-chip>
            }
          </span>
        }
        @if (inputPrefixTpl(); as prefixTpl) {
          <span class="cngx-combobox__prefix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="prefixTpl; context: inputSlotContext()" />
          </span>
        }
        <input
          #searchInput="cngxListboxSearch"
          #inputEl
          cngxListboxSearch
          type="text"
          class="cngx-combobox__input"
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
          [closeOnSelect]="closeOnSelect()"
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
        />
        @if (inputSuffixTpl(); as suffixTpl) {
          <span class="cngx-combobox__suffix" (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="suffixTpl; context: inputSlotContext()" />
          </span>
        }
        @if (clearable() && !isEmpty() && !disabled()) {
          @if (tpl.clearButton(); as clearBtnTpl) {
            <span class="cngx-combobox__clear-slot" (click)="$event.stopPropagation()">
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
              class="cngx-combobox__clear-all"
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
            <span aria-hidden="true" class="cngx-combobox__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-combobox__caret">&#9662;</span>
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
  styleUrls: ['../shared/select-base.css', './combobox.component.css'],
})
export class CngxCombobox<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

  // ── Inputs (primary API — unchanged) ───────────────────────────────

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
   * Popover placement relative to the trigger. Per-instance input
   * wins over {@link CngxSelectConfig.popoverPlacement}.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  /**
   * Mobile `inputmode` attribute. Defaults from
   * {@link CngxSelectConfig.inputMode} (`'search'`).
   */
  readonly inputMode = input<NonNullable<CngxSelectConfig['inputMode']>>(
    this.config.inputMode,
  );
  /**
   * Mobile `enterkeyhint` attribute. Defaults to `'enter'` (Combobox
   * commits Enter without closing the panel). App-wide config wins
   * when non-null.
   */
  readonly enterKeyHint = input<NonNullable<CngxSelectConfig['enterKeyHint']>>(
    this.config.enterKeyHint ?? 'enter',
  );

  /**
   * Whether activating an option closes the panel. Defaults to `false`
   * (tag-input UX — keep typing after each pick).
   */
  readonly closeOnSelect = input<boolean>(false);

  /** Custom matcher used by the inline `CngxListboxSearch`. */
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);

  /** Debounce for search term updates, in milliseconds. Defaults to `typeaheadDebounceInterval` from the resolved select config (300ms). */
  readonly searchDebounceMs = input<number>(this.config.typeaheadDebounceInterval);

  /** Suppress the first `searchTermChange` emission (hydrate-time `''`). */
  readonly skipInitial = input<boolean>(false);

  /** Hide the default in-panel checkmark on this instance. */
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);

  /** Per-instance override for the indicator position. `null` → inherit config (`'before'`). */
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);

  /** Per-instance override for the indicator variant. `null` → inherit config (`'auto'`). */
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(null);

  /** Hide the default dropdown caret glyph. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /**
   * Replaces the built-in `✕` glyph inside the default clear-all button
   * without forking the button frame or ARIA wiring. When
   * `*cngxSelectClearButton` is projected, the projected template takes
   * full precedence and this input is ignored.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in `▾` caret glyph. When `*cngxSelectCaret` is
   * projected, it takes full precedence and this input is ignored.
   */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);

  /** Render a clear-all button when at least one value is selected. */
  readonly clearable = input<boolean>(false);

  /** A11y label for the clear-all button. */
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Auswahl zurücksetzen',
  );

  /** A11y label prefix for the per-chip remove button. */
  readonly chipRemoveAriaLabel = input<string>(
    this.config.ariaLabels?.chipRemove ?? 'Entfernen',
  );

  /** Display a loading state inside the panel. */
  readonly loading = input<boolean>(false);

  /** First-load indicator variant. */
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);

  /** Number of skeleton rows when `loadingVariant === 'skeleton'`. */
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);

  /** Subsequent-load ("refreshing") indicator variant. */
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);

  /** Async-state source for options. */
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);

  /** Callback invoked when the user clicks the default retry-button. */
  readonly retryFn = input<(() => void) | null>(null);

  /** Async write handler invoked per toggle. */
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);

  /** Commit UX mode. */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');

  /** Where `commitAction` errors render without a `*cngxSelectCommitError` template. */
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );

  /** Per-instance announcer override. */
  readonly announceChanges = input<boolean | null>(null);

  /** Per-instance formatter override for the announcer message. */
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  /** Two-way multi-value binding. */
  readonly values = model<T[]>([]);

  // ── Outputs ────────────────────────────────────────────────────────

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

  // ── Content-child directive queries ────────────────────────────────

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly triggerLabelDirective = contentChild<CngxComboboxTriggerLabel<T>>(
    CngxComboboxTriggerLabel,
  );
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(
    CngxSelectOptionLabel,
  );
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly refreshingDirective =
    contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective = contentChild<CngxSelectCommitError<T>>(
    CngxSelectCommitError,
  );
  private readonly clearButtonDirective =
    contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective = contentChild<CngxSelectOptionPending<T>>(
    CngxSelectOptionPending,
  );
  private readonly optionErrorDirective = contentChild<CngxSelectOptionError<T>>(
    CngxSelectOptionError,
  );
  private readonly inputPrefixDirective = contentChild<CngxSelectInputPrefix>(CngxSelectInputPrefix);
  private readonly inputSuffixDirective = contentChild<CngxSelectInputSuffix>(CngxSelectInputSuffix);

  // ── Resolved template-slot registry ────────────────────────────────

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
  /** Combobox-specific trigger-label slot. @internal */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxComboboxTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);
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

  // ── Public derived signals (trigger-specific) ──────────────────────

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** Active-descendant id, forwarded to the input's aria-activedescendant. */
  readonly activeId = computed<string | null>(
    () => this.listboxRef()?.ad.activeId() ?? null,
  );

  /** Debounced search term — signal-first primary API. */
  readonly searchTerm: Signal<string> = computed(
    () => this.searchInputRef()?.term() ?? '',
  );

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

  /**
   * Filter overlay bound to the inline search term. `null` when term is
   * empty — the core short-circuits and returns `effectiveOptions`
   * unchanged. `null` also when the search directive hasn't resolved
   * yet (first render before `viewChild` populates).
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

  /**
   * Signal-graph factory shared with {@link CngxSelect} and {@link CngxMultiSelect}.
   * Owns every derivation that's identical across the family: ARIA
   * projection, panel view, option model, commit-controller surface,
   * announcer helper. The component keeps value-shape specifics
   * (AD-activated dispatch, Field↔sync, trigger keyboard) and this
   * thin adapter surface for template bindings.
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

  // ── Template-facing protected surface (delegates to core) ──────────

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

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal — latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal — errorContext signal (wired once with the retry handler). */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal — commitErrorContext signal (wired once with retry handler). */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => this.commitHandler.retryLast());

  /**
   * Currently selected options (public). Structurally compared by
   * `.value` under `compareWith` so fresh OptionDef references carrying
   * the same values do not cascade re-renders on consumer bindings.
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

  // ── Multi-selection state (value-shape-specific) ───────────────────

  /**
   * Options currently selected, resolved from `values()`. Uses the
   * O(1) map fast-path from the core when the compareWith is the
   * default; falls back to O(n) scan otherwise.
   */
  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      // Look up selected values against the UNFILTERED option merge so
      // chips for previously-picked values remain visible when the
      // inline search term temporarily hides the matching option from
      // the listbox.
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

  // ── Commit state (delegated helpers) ───────────────────────────────

  private readonly togglingOption = this.core.togglingOption;

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /** Tracks whether the first `searchTermChange` emission has been processed. */
  private readonly hasEmittedInitial = signal(false);

  /**
   * Commit-flow handler — owns commit-controller lifecycle, value
   * reconciliation, rollback-on-error, and live-region announcements.
   * Shared with `CngxMultiSelect` via `shared/array-commit-handler.ts`.
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

  // ── Panel-host surface forwarding ──────────────────────────────────
  /** @internal */ protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */ protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */ protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */ protected readonly isCommittingOption = this.core.panelHostAdapter.isCommittingOption;

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  /**
   * WeakMap cache of per-option remove callbacks. Stable closures per
   * option prevent `ngTemplateOutlet` thrash on template re-renders.
   */
  private readonly chipRemoveCache = new WeakMap<
    CngxSelectOptionDef<T>,
    () => void
  >();

  /** @internal — stable `remove()` callback per option for chip slots. */
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

    // Honor [autofocus] on first render.
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Bridge AD-activations into user-selection outputs and commit flow.
    // Lifecycle + routing live in `createADActivationDispatcher`;
    // array-shape toggle logic stays here.
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
        // Listbox has already mutated values — reconstruct the pre-
        // toggle snapshot by inverting the change.
        const currentSelected = this.isSelected(opt);
        const current = this.values();
        const eq = this.compareWith();
        const previousValues = currentSelected
          ? current.filter((v) => !eq(v, opt.value))
          : [...current, opt.value];
        this.finalizeToggle(opt, currentSelected, previousValues);
      },
    });

    // Panel open/close lifecycle events.
    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.inputEl,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
    });

    // Bidirectional sync with the bound form field (if any).
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

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal — click on the wrapper routes focus into the input + opens. */
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

  /** @internal */
  /** @internal — click-outside dismissal (action-dirty-guarded). */
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
    this.removeOption(opt);
  }

  /**
   * @internal — invoked by `CngxListboxTrigger`'s `(backspaceOnEmpty)`.
   * Removes the trailing chip via the same commit-aware path the ✕ uses.
   */
  protected removeLastChip(): void {
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return;
    }
    this.removeOption(selected[selected.length - 1]);
  }

  /** Shared removal path for chip ✕, Backspace-on-empty, and callback. */
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

  /** @internal */
  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAllCallback();
  }

  /** @internal — imperative clear-all used by slot + default button. */
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

