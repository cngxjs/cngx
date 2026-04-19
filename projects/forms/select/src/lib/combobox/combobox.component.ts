import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
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
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import { CngxSelectPanel } from '../shared/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFieldRef,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CNGX_SELECT_PANEL_HOST } from '../shared/panel-host';
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
import { resolveTemplate } from '../shared/resolve-template';
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
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxCombobox.selectionChange}.
 *
 * @category interactive
 */
export interface CngxComboboxChange<T = unknown> {
  readonly source: CngxCombobox<T>;
  readonly values: readonly T[];
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
      <div
        class="cngx-combobox__trigger"
        role="group"
        [attr.aria-label]="triggerAria().label"
        [attr.aria-labelledby]="triggerAria().labelledBy"
        [attr.aria-disabled]="triggerAria().disabled"
        (click)="handleWrapperClick($event)"
      >
        @if (triggerLabelTpl(); as tpl) {
          <span class="cngx-select__chip-list cngx-combobox__trigger-label">
            <ng-container
              *ngTemplateOutlet="
                tpl;
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
          [attr.aria-expanded]="triggerAria().expanded"
          [attr.aria-controls]="pop.id()"
          [attr.aria-autocomplete]="'list'"
          [attr.aria-activedescendant]="activeId()"
          [attr.aria-describedby]="triggerAria().describedBy"
          [attr.aria-errormessage]="triggerAria().errorMessage"
          [attr.aria-invalid]="triggerAria().invalid"
          [attr.aria-required]="triggerAria().required"
          [attr.aria-busy]="triggerAria().busy"
          (focus)="handleFocus()"
          (blur)="handleBlur()"
          (backspaceOnEmpty)="removeLastChip()"
        />
        @if (clearable() && !isEmpty() && !disabled()) {
          @if (clearButtonTpl(); as tpl) {
            <span class="cngx-combobox__clear-slot" (click)="$event.stopPropagation()">
              <ng-container
                *ngTemplateOutlet="
                  tpl;
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
              ✕
            </button>
          }
        }
        @if (resolvedShowCaret()) {
          @if (caretTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl; context: { $implicit: panelOpen(), open: panelOpen() }"
            />
          } @else {
            <span aria-hidden="true" class="cngx-combobox__caret">&#9662;</span>
          }
        }
      </div>
      <div
        cngxPopover
        #pop="cngxPopover"
        placement="bottom"
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
   * Whether activating an option closes the panel. Defaults to `false`
   * (tag-input UX — keep typing after each pick).
   */
  readonly closeOnSelect = input<boolean>(false);

  /** Custom matcher used by the inline `CngxListboxSearch`. */
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);

  /** Debounce for search term updates, in milliseconds. */
  readonly searchDebounceMs = input<number>(300);

  /** Suppress the first `searchTermChange` emission (hydrate-time `''`). */
  readonly skipInitial = input<boolean>(false);

  /** Hide the default in-panel checkmark on this instance. */
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);

  /** Hide the default dropdown caret glyph. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /** Render a clear-all button when at least one value is selected. */
  readonly clearable = input<boolean>(false);

  /** A11y label for the clear-all button. */
  readonly clearButtonAriaLabel = input<string>('Auswahl zurücksetzen');

  /** A11y label prefix for the per-chip remove button. */
  readonly chipRemoveAriaLabel = input<string>('Entfernen');

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

  // ── Resolved template refs ─────────────────────────────────────────

  /** @internal */
  protected readonly checkTpl = resolveTemplate(this.checkDirective, 'check');
  /** @internal */
  protected readonly caretTpl = resolveTemplate(this.caretDirective, 'caret');
  /** @internal */
  protected readonly optgroupTpl = resolveTemplate(this.optgroupDirective, 'optgroup');
  /** @internal */
  protected readonly placeholderTpl = resolveTemplate(this.placeholderDirective, 'placeholder');
  /** @internal */
  protected readonly emptyTpl = resolveTemplate(this.emptyDirective, 'empty');
  /** @internal */
  protected readonly loadingTpl = resolveTemplate(this.loadingDirective, 'loading');
  /** Combobox-specific trigger-label slot. @internal */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxComboboxTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** @internal */
  protected readonly optionLabelTpl = resolveTemplate(this.optionLabelDirective, 'optionLabel');
  /** @internal */
  protected readonly errorTpl = resolveTemplate(this.errorDirective, 'error');
  /** @internal */
  protected readonly refreshingTpl = resolveTemplate(this.refreshingDirective, 'refreshing');
  /** @internal */
  protected readonly commitErrorTpl = resolveTemplate(this.commitErrorDirective, 'commitError');
  /** @internal */
  protected readonly clearButtonTpl = resolveTemplate(this.clearButtonDirective, 'clearButton');
  /** @internal */
  protected readonly optionPendingTpl = resolveTemplate(this.optionPendingDirective, 'optionPending');
  /** @internal */
  protected readonly optionErrorTpl = resolveTemplate(this.optionErrorDirective, 'optionError');

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

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

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
    },
    {
      announceChanges: this.announceChanges,
      announceTemplate: this.announceTemplate,
    },
  );

  // ── Template-facing protected surface (delegates to core) ──────────

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
  /** @internal */ protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */ protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly ariaReadonly = this.core.ariaReadonly;
  /** @internal */ protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */ protected readonly externalActivation = this.core.externalActivation;
  /** @internal */ protected readonly showCommitError = this.core.showCommitError;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal — latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal — errorContext signal (wired once with the retry handler). */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal — commitErrorContext signal (wired once with retry handler). */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => this.retryCommit());

  /** Currently selected options (public). */
  readonly selected: Signal<readonly CngxSelectOptionDef<T>[]> = computed(
    () => this.selectedOptions(),
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
      const map = this.core.valueToOptionMap();
      if (map) {
        const out: CngxSelectOptionDef<T>[] = [];
        for (const v of vals) {
          const match = map.get(v as unknown);
          if (match) {
            out.push(match);
          }
        }
        return out;
      }
      const eq = this.compareWith();
      const out: CngxSelectOptionDef<T>[] = [];
      const flat = this.flatOptions();
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

  private readonly commitController = this.core.commitController;
  private readonly togglingOption = this.core.togglingOption;

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /** Tracks whether the first `searchTermChange` emission has been processed. */
  private readonly hasEmittedInitial = signal(false);

  /** @internal — `optionLabelTpl`/option-row uses this via panel-host. */
  protected isCommittingOption(opt: CngxSelectOptionDef<T>): boolean {
    return this.core.isCommittingOption(opt);
  }

  // ── Panel-host surface forwarding ──────────────────────────────────

  protected isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T> {
    return this.core.isGroup(item);
  }

  protected isSelected(opt: CngxSelectOptionDef<T>): boolean {
    const vals = this.values();
    if (vals.length === 0) {
      return false;
    }
    const map = this.core.valueToOptionMap();
    if (map) {
      return vals.some((v) => Object.is(v, opt.value));
    }
    const eq = this.compareWith();
    return vals.some((v) => eq(v, opt.value));
  }

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
    effect((onCleanup) => {
      const lb = this.listboxRef();
      if (!lb) {
        return;
      }
      const sub = lb.ad.activated.subscribe((raw: unknown) => {
        untracked(() => {
          const toggledValue = raw as T;
          const opt = this.core.findOption(toggledValue);
          if (!opt) {
            return;
          }
          const action = this.commitAction();
          if (action) {
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
            this.beginCommit(next, previous, opt, action);
            return;
          }
          const currentSelected = this.isSelected(opt);
          this.finalizeToggle(opt, currentSelected);
        });
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Panel open/close lifecycle events.
    effect(() => {
      const open = this.panelOpen();
      untracked(() => {
        this.openedChange.emit(open);
        if (open) {
          this.opened.emit();
        } else {
          this.closed.emit();
          if (this.config.restoreFocus) {
            queueMicrotask(() => this.inputEl()?.nativeElement.focus());
          }
        }
      });
    });

    // Field → Combobox: mirror bound field value into our model.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef: CngxFieldRef = presenter.fieldState();
      const fieldValue = fieldRef.value();
      const arr = Array.isArray(fieldValue) ? (fieldValue as T[]) : [];
      untracked(() => {
        const current = this.values();
        if (!sameArrayContents(current, arr, this.compareWith())) {
          this.values.set([...arr]);
        }
      });
    });

    // Combobox → Field: push selection back into bound field.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const next = this.values();
      untracked(() => {
        const current = fieldRef.value();
        const currentArr = Array.isArray(current) ? (current as T[]) : [];
        if (sameArrayContents(currentArr, next, this.compareWith())) {
          return;
        }
        writeFieldValue(fieldRef, [...next]);
      });
    });

    // Term → searchTermChange output (with [skipInitial] guard).
    effect(() => {
      const term = this.searchTerm();
      untracked(() => {
        const initial = !this.hasEmittedInitial();
        this.hasEmittedInitial.set(true);
        if (initial && this.skipInitial()) {
          return;
        }
        this.searchTermChange.emit(term);
      });
    });

    // Term → auto-open panel on typing.
    effect(() => {
      const term = this.searchTerm();
      untracked(() => {
        if (term !== '' && !this.panelOpen() && !this.disabled()) {
          this.open();
        }
      });
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
  protected handleClickOutside(): void {
    const mode = this.config.dismissOn;
    if (mode === 'outside' || mode === 'both') {
      if (this.popoverRef()?.isVisible()) {
        this.close();
      }
    }
  }

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
      this.beginCommit(next, previous, opt, action);
      return;
    }
    this.values.set(next);
    this.finalizeToggle(opt, false);
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
      this.beginCommitClear(previous, action);
      return;
    }
    this.values.set([]);
    this.cleared.emit();
    this.selectionChange.emit({
      source: this,
      values: [],
      added: [],
      removed: previous,
      option: null,
      action: 'clear',
    });
    this.core.announce(null, 'removed', 0, true);
  };

  /** @internal */
  protected handleFocus(): void {
    this.focusedState.set(true);
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.presenter?.fieldState().markAsTouched();
  }

  // ── Commit orchestration ───────────────────────────────────────────

  private finalizeToggle(opt: CngxSelectOptionDef<T>, isNowSelected: boolean): void {
    this.optionToggled.emit({ option: opt, added: isNowSelected });
    this.selectionChange.emit({
      source: this,
      values: this.values(),
      added: isNowSelected ? [opt.value] : [],
      removed: isNowSelected ? [] : [opt.value],
      option: opt,
      action: 'toggle',
    });
    this.core.announce(opt, isNowSelected ? 'added' : 'removed', this.values().length, true);
  }

  private beginCommit(
    next: T[],
    previous: T[],
    opt: CngxSelectOptionDef<T>,
    action: CngxSelectCommitAction<T[]>,
  ): void {
    this.stateChange.emit('pending');
    const mode = this.commitMode();
    this.commitController.begin(action, next, previous, {
      onSuccess: (committed) => {
        this.stateChange.emit('success');
        const finalValues = committed ?? next;
        if (!sameArrayContents(this.values(), finalValues, this.compareWith())) {
          this.values.set([...finalValues]);
        }
        const isNowSelected = finalValues.some((v) => this.compareWith()(v, opt.value));
        this.togglingOption.set(null);
        this.finalizeToggle(opt, isNowSelected);
      },
      onError: (err, rollbackTo) => {
        this.stateChange.emit('error');
        this.commitError.emit(err);
        if (mode === 'optimistic') {
          if (!sameArrayContents(this.values(), rollbackTo ?? [], this.compareWith())) {
            this.values.set([...(rollbackTo ?? [])]);
          }
        }
        this.core.announce(null, 'removed', this.values().length, true);
      },
    });
  }

  private beginCommitClear(previous: T[], action: CngxSelectCommitAction<T[]>): void {
    this.stateChange.emit('pending');
    const mode = this.commitMode();
    this.commitController.begin(action, [], previous, {
      onSuccess: (committed) => {
        this.stateChange.emit('success');
        const finalValues = committed ?? [];
        if (!sameArrayContents(this.values(), finalValues, this.compareWith())) {
          this.values.set([...finalValues]);
        }
        this.togglingOption.set(null);
        this.cleared.emit();
        this.selectionChange.emit({
          source: this,
          values: finalValues,
          added: [],
          removed: previous,
          option: null,
          action: 'clear',
        });
        this.core.announce(null, 'removed', finalValues.length, true);
      },
      onError: (err, rollbackTo) => {
        this.stateChange.emit('error');
        this.commitError.emit(err);
        if (mode === 'optimistic') {
          if (!sameArrayContents(this.values(), rollbackTo ?? [], this.compareWith())) {
            this.values.set([...(rollbackTo ?? [])]);
          }
        }
        this.core.announce(null, 'removed', this.values().length, true);
      },
    });
  }

  /** @internal — replay the last failed commit. */
  private retryCommit(): void {
    const intendedNext = this.commitController.intendedValue();
    const action = this.commitAction();
    if (!action || intendedNext === undefined) {
      return;
    }
    const opt = this.togglingOption();
    if (opt === null) {
      this.beginCommitClear(this.lastCommittedValues, action);
      return;
    }
    this.beginCommit(intendedNext, this.lastCommittedValues, opt, action);
  }
}

function sameArrayContents<T>(
  a: readonly T[],
  b: readonly T[],
  eq: CngxSelectCompareFn<T>,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

function writeFieldValue(fieldRef: CngxFieldRef, value: unknown): void {
  const signalLike = fieldRef.value as unknown;
  if (
    typeof signalLike === 'function' &&
    'set' in signalLike &&
    typeof (signalLike as { set: unknown }).set === 'function'
  ) {
    (signalLike as { set: (v: unknown) => void }).set(value);
  }
}
