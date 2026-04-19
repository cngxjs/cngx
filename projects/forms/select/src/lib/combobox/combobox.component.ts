import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  type Signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';

import { CNGX_STATEFUL, type CngxAsyncState, type AsyncStatus } from '@cngx/core/utils';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';

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

import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
} from '../shared/commit-controller';
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
  flattenSelectOptions,
  isCngxSelectOptionGroupDef,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { resolveSelectConfig } from '../shared/resolve-config';
import { resolveTemplate } from '../shared/resolve-template';
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

type CompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;
const defaultCompare: CompareFn<unknown> = (a, b) => Object.is(a, b);

/**
 * Change event emitted by {@link CngxCombobox.selectionChange} whenever
 * a user-driven action — not a programmatic write — toggles the
 * selection array. Shape mirrors `CngxMultiSelectChange` so consumers
 * that handle both variants can share one callback signature.
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
 * (multi). The trigger carries an inline `<input role="combobox">`
 * next to the chip strip; typing filters the option panel live (wired
 * in Phase B) and Backspace-on-empty removes the trailing chip (also
 * Phase B). Everything else — panel body, option model, async state,
 * commit action, announcer — reuses the `shared/` layer verbatim.
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

        The focusable element is the inner <input role="combobox">.
        The wrapper carries role="group" so AT users hear the
        chip-strip + input as one logical widget. Chip × buttons are
        valid siblings of the input (no nested <button> problem that
        forces the Select/MultiSelect <div role="combobox"> pattern).
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
          [openOnFocus]="true"
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
          (keydown)="handleInputKeydown($event)"
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
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly config = resolveSelectConfig();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // ── Inputs ─────────────────────────────────────────────────────────

  /** Accessible label for the listbox region and fallback trigger name. */
  readonly label = input<string>('');

  /** Options in data-driven mode (flat or grouped). */
  readonly options = input<CngxSelectOptionsInput<T>>([] as CngxSelectOptionsInput<T>);

  /** Placeholder rendered inside the input when nothing is selected. */
  readonly placeholder = input<string>('');

  /** Disabled state. Merges with `presenter.disabled()` inside a form-field. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Required state. Merges with `presenter.required()` inside a form-field. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** Equality function used to match values to options. Defaults to `Object.is`. */
  readonly compareWith = input<CompareFn<T>>(defaultCompare as CompareFn<T>);

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
   * Whether activating an option closes the panel.
   *
   * Defaults to `false` to match tag-input UX: after picking one value
   * the user usually wants to keep typing for the next chip. Set `true`
   * for "one-shot combobox" flows (no chip strip, single pick).
   */
  readonly closeOnSelect = input<boolean>(false);

  /** Custom matcher used by the inline `CngxListboxSearch`. */
  readonly searchMatchFn = input<ListboxMatchFn | null>(null);

  /** Debounce for search term updates, in milliseconds. */
  readonly searchDebounceMs = input<number>(300);

  /**
   * Suppress the first `searchTermChange` emission (the initial `''`
   * that fires when the directive hydrates). Useful for consumers that
   * kick off a server request on every term change and don't want a
   * fetch for the empty-string initial state.
   *
   * Does NOT affect `effectiveOptions` filtering — only the output
   * stream. Defaults to `false` for parity with other cngx search
   * bridges.
   */
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

  /** Async-state source for options. Takes precedence over `[options]` when set. */
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);

  /** Callback invoked when the user clicks the default retry-button. */
  readonly retryFn = input<(() => void) | null>(null);

  /** Async write handler invoked per toggle. */
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);

  /** Commit UX mode. See {@link CngxMultiSelect.commitMode}. */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');

  /** Where `commitAction` errors render without a `*cngxSelectCommitError` template. */
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );

  /** Per-instance announcer override. `null` defers to config / library default. */
  readonly announceChanges = input<boolean | null>(null);

  /** Per-instance formatter override for the announcer message. */
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  /** Two-way multi-value binding. */
  readonly values = model<T[]>([]);

  // ── Outputs ────────────────────────────────────────────────────────

  /** Fires on user-driven selection changes. */
  readonly selectionChange = output<CngxComboboxChange<T>>();

  /** Fires once per toggle with the affected option and its new state. */
  readonly optionToggled = output<{
    readonly option: CngxSelectOptionDef<T>;
    readonly added: boolean;
  }>();

  /** Fires whenever the panel open state changes. */
  readonly openedChange = output<boolean>();

  /** Fires on panel open. */
  readonly opened = output<void>();

  /** Fires on panel close. */
  readonly closed = output<void>();

  /** Fires when the clear-all button empties the selection. */
  readonly cleared = output<void>();

  /** Fires when the user triggers a retry from the error panel. */
  readonly retry = output<void>();

  /** Fires with the rejected error when a `commitAction` transitions to error. */
  readonly commitError = output<unknown>();

  /** Fires on every `commitState` status transition. */
  readonly stateChange = output<AsyncStatus>();

  /**
   * Fires with the latest debounced search term (Phase B wires the
   * bridge). Wiring an empty output at Phase A keeps the public
   * surface stable.
   */
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
  /**
   * Combobox-specific trigger-label slot. Unlike the generic slots, the
   * context shape carries the full multi-selection array + count so a
   * consumer can render either a chip-like summary ("3 Themen") or a
   * first-label-plus-overflow badge. Bypasses `resolveTemplate`
   * because it has no matching global config key.
   *
   * @internal
   */
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
  /** @internal — latest commit error routed to optionErrorTpl context. */
  readonly commitErrorValue = computed<unknown>(() => this.commitState.error());

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly searchInput = viewChild(CngxListboxSearch);
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  // ── Public Signals ─────────────────────────────────────────────────

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** Active-descendant id, forwarded to the input's aria-activedescendant. */
  readonly activeId = computed<string | null>(
    () => this.listboxRef()?.ad.activeId() ?? null,
  );

  /** Currently selected options (public). */
  readonly selected: Signal<readonly CngxSelectOptionDef<T>[]> = computed(
    () => this.selectedOptions(),
  );

  // ── CngxFormFieldControl implementation ────────────────────────────

  readonly id = computed<string>(() => this.resolvedId() ?? '');

  readonly disabled = computed<boolean>(
    () => this.disabledInput() || (this.presenter?.disabled() ?? false),
  );

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  readonly empty = computed<boolean>(() => this.isEmpty());

  // ── Internal: ARIA projection ──────────────────────────────────────

  /** @internal */
  protected readonly describedBy = computed(() => this.presenter?.describedBy() ?? null);
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.errorState() ? true : null));
  /** @internal */
  protected readonly ariaBusy = computed(() => {
    if (this.presenter?.pending()) {
      return true;
    }
    const s = this.state();
    if (s?.isLoading() || s?.isPending() || s?.isRefreshing()) {
      return true;
    }
    if (this.isCommitting()) {
      return true;
    }
    return null;
  });
  /** @internal */
  protected readonly ariaReadonly = computed(() => (this.presenter?.readonly() ? true : null));
  /** @internal */
  protected readonly ariaErrorMessage = computed(() =>
    this.errorState() ? (this.presenter?.errorId() ?? null) : null,
  );

  /** @internal */
  protected readonly resolvedId = computed<string>(() => {
    const override = this.idInput();
    if (override) {
      return override;
    }
    return this.presenter?.inputId() ?? '';
  });

  /** @internal */
  protected readonly resolvedAriaLabel = computed<string | null>(() => {
    const explicit = this.ariaLabel();
    if (explicit) {
      return explicit;
    }
    if (this.resolvedAriaLabelledBy()) {
      return null;
    }
    return this.label() || null;
  });

  /** @internal */
  protected readonly resolvedAriaLabelledBy = computed<string | null>(
    () => this.ariaLabelledBy() ?? this.presenter?.labelId() ?? null,
  );

  /** @internal */
  protected readonly resolvedAriaRequired = computed<boolean | null>(() =>
    this.requiredInput() || this.presenter?.required() ? true : null,
  );

  /** @internal */
  protected readonly effectiveTabIndex = computed<number | null>(() =>
    this.disabled() ? -1 : this.tabIndex(),
  );

  /**
   * @internal — bundled ARIA projection for the trigger. Mirrors the
   * shape used by Select/MultiSelect; the wrapper `<div role="group">`
   * reads `label` / `labelledBy` / `disabled`, the inner input reads
   * the rest.
   */
  protected readonly triggerAria = computed(
    () => ({
      label: this.resolvedAriaLabel(),
      labelledBy: this.resolvedAriaLabelledBy(),
      describedBy: this.describedBy(),
      errorMessage: this.ariaErrorMessage(),
      expanded: this.panelOpen(),
      disabled: this.disabled() || null,
      invalid: this.ariaInvalid(),
      required: this.resolvedAriaRequired(),
      busy: this.ariaBusy(),
    }),
    {
      equal: (a, b) =>
        a.label === b.label &&
        a.labelledBy === b.labelledBy &&
        a.describedBy === b.describedBy &&
        a.errorMessage === b.errorMessage &&
        a.expanded === b.expanded &&
        a.disabled === b.disabled &&
        a.invalid === b.invalid &&
        a.required === b.required &&
        a.busy === b.busy,
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
  protected readonly resolvedShowSelectionIndicator = computed<boolean>(
    () => !this.hideSelectionIndicator(),
  );

  /** @internal */
  protected readonly resolvedShowCaret = computed<boolean>(() => !this.hideCaret());

  /** @internal */
  protected readonly resolvedListboxLabel = computed<string>(() => {
    const label = this.label();
    if (label.length > 0) {
      return label;
    }
    const aria = this.ariaLabel();
    if (aria && aria.length > 0) {
      return aria;
    }
    const placeholder = this.placeholder();
    if (placeholder.length > 0) {
      return placeholder;
    }
    return 'Options';
  });

  /** @internal */
  protected readonly panelClassList = computed<string | readonly string[] | null>(
    () => {
      const global = this.config.panelClass;
      const local = this.panelClass();
      if (!global && !local) {
        return null;
      }
      if (!global) {
        return local;
      }
      if (!local) {
        return global;
      }
      const globalArr: readonly string[] = Array.isArray(global)
        ? (global as readonly string[])
        : [global as string];
      const localArr: readonly string[] = Array.isArray(local)
        ? (local as readonly string[])
        : [local as string];
      return [...globalArr, ...localArr];
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        const aArr = Array.isArray(a) ? a : a == null ? null : [a];
        const bArr = Array.isArray(b) ? b : b == null ? null : [b];
        if (aArr === null && bArr === null) {
          return true;
        }
        if (aArr === null || bArr === null) {
          return false;
        }
        if (aArr.length !== bArr.length) {
          return false;
        }
        for (let i = 0; i < aArr.length; i++) {
          if (aArr[i] !== bArr[i]) {
            return false;
          }
        }
        return true;
      },
    },
  );

  /** @internal */
  protected readonly panelWidthCss = computed<string | null>(() => {
    const w = this.panelWidth();
    if (w === null) {
      return 'auto';
    }
    if (w === 'trigger') {
      return 'anchor-size(width)';
    }
    return `${w}px`;
  });

  /**
   * @internal — effective matcher for `CngxListboxSearch`. Default is
   * the directive's built-in case-insensitive substring match; a
   * consumer-supplied `[searchMatchFn]` wins.
   */
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
   * @internal — effective option list: async-state > `[options]`,
   * then the live search term applied through {@link filterSelectOptions}.
   *
   * When the consumer supplies a remote data source that already
   * filters on the server (via `[state]` subscribing to
   * `(searchTermChange)`) they can disable the local filter by
   * matching every option — pass `[searchMatchFn]="() => true"`.
   */
  protected readonly effectiveOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const s = this.state();
    const fromState = s?.data();
    const all = fromState ?? this.options();
    const term = this.searchInput()?.term() ?? '';
    if (term === '') {
      return all;
    }
    return filterSelectOptions(all, term, this.effectiveMatchFn());
  });

  /** @internal */
  protected readonly flatOptions = computed<CngxSelectOptionDef<T>[]>(
    () => flattenSelectOptions(this.effectiveOptions()),
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

  /**
   * @internal — O(1) value→option lookup when `compareWith` is the
   * default identity check. Falls back to an O(n) scan for custom
   * comparators (which defeat Map-keyed lookup). Keyed on raw `value`
   * so Maps constructed from primitives (strings, numbers) stay cheap.
   */
  private readonly valueToOptionMap = computed<Map<unknown, CngxSelectOptionDef<T>> | null>(
    () => {
      const eq = this.compareWith();
      if (eq !== (defaultCompare as unknown)) {
        return null;
      }
      const map = new Map<unknown, CngxSelectOptionDef<T>>();
      for (const opt of this.flatOptions()) {
        map.set(opt.value as unknown, opt);
      }
      return map;
    },
  );

  /** @internal */
  protected readonly activeView = computed<AsyncView>(() => {
    const s = this.state();
    if (s) {
      return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
    }
    if (this.loading()) {
      return 'skeleton';
    }
    if (this.effectiveOptions().length === 0) {
      return 'empty';
    }
    return 'content';
  });

  /** @internal */
  protected readonly showRefreshIndicator = computed<boolean>(() => {
    const s = this.state();
    if (!s) {
      return false;
    }
    const status = s.status();
    return status === 'refreshing' || (status === 'loading' && !s.isFirstLoad());
  });

  /** @internal */
  protected readonly showInlineError = computed<boolean>(
    () => this.activeView() === 'content+error',
  );

  /** @internal */
  protected readonly skeletonIndices = computed<number[]>(
    () => Array.from({ length: Math.max(1, this.skeletonRowCount()) }, (_, i) => i),
    { equal: (a, b) => a.length === b.length },
  );

  // ── Multi-selection state ──────────────────────────────────────────

  /**
   * Options currently selected, resolved from `values()` against
   * `flatOptions()`. Uses the O(1) map fast-path when available.
   */
  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      const map = this.valueToOptionMap();
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

  // ── Commit action state ─────────────────────────────────────────────

  private readonly commitController: CngxCommitController<T[]> =
    inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY)<T[]>();

  /** Read-only view of the commit lifecycle. */
  readonly commitState: CngxAsyncState<T[] | undefined> = this.commitController.state;

  /** `true` while a commit is in flight. */
  readonly isCommitting: Signal<boolean> = this.commitController.isCommitting;

  /** Option the user just toggled — drives per-row spinner / commit-error context. */
  private readonly togglingOption = signal<CngxSelectOptionDef<T> | null>(null);

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /** @internal — drives `[externalActivation]` on the inner listbox. */
  protected readonly externalActivation = computed<boolean>(() => this.commitAction() !== null);

  /** @internal — inline/banner surface for `commitState.isError()`. */
  protected readonly showCommitError = computed<boolean>(
    () => this.commitState.status() === 'error' && this.commitErrorDisplay() !== 'none',
  );

  /** @internal — context passed to the `[cngxSelectCommitError]` template. */
  protected readonly commitErrorContext = computed(
    () => ({
      $implicit: this.commitState.error(),
      error: this.commitState.error(),
      option: this.togglingOption(),
      retry: (): void => this.retryCommit(),
    }),
    {
      equal: (a, b) => Object.is(a.error, b.error) && Object.is(a.option, b.option),
    },
  );

  /** @internal — error context for the `[cngxSelectError]` template. */
  protected readonly errorContext = computed(
    () => ({
      $implicit: this.state()?.error(),
      error: this.state()?.error(),
      retry: (): void => this.handleRetry(),
    }),
    {
      equal: (a, b) => Object.is(a.error, b.error),
    },
  );

  /** @internal */
  protected isCommittingOption(opt: CngxSelectOptionDef<T>): boolean {
    if (!this.isCommitting()) {
      return false;
    }
    const t = this.togglingOption();
    if (!t) {
      return false;
    }
    return this.compareWith()(opt.value, t.value);
  }

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // ── Template helpers (panel-host surface) ──────────────────────────

  protected isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T> {
    return isCngxSelectOptionGroupDef(item);
  }

  protected isSelected(opt: CngxSelectOptionDef<T>): boolean {
    const vals = this.values();
    if (vals.length === 0) {
      return false;
    }
    const map = this.valueToOptionMap();
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
   * WeakMap cache of per-option remove callbacks. A fresh closure every
   * template pass would thrash `ngTemplateOutlet` — each option's
   * callback is stable for the option's lifetime instead.
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
          const opt = this.findOption(toggledValue);
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

    // Field → Combobox: mirror bound field value (expected T[]) into our model.
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
        if (!sameArrayContents(current, arr, this.compareWith() as CompareFn<unknown>)) {
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
        if (sameArrayContents(currentArr, next, this.compareWith() as CompareFn<unknown>)) {
          return;
        }
        writeFieldValue(fieldRef, [...next]);
      });
    });

    // Search-term bridge: surface the debounced term to consumers (for
    // server-driven autocomplete wiring) and re-open the panel when
    // typing starts after an Escape-dismiss. Re-open is intentional
    // tag-input UX: typing always implies "show me matches".
    //
    // `[skipInitial]` drops the very first emission (the hydrate-time
    // empty string) so server-driven consumers don't fire a useless
    // "load everything" request on mount. Panel-open semantics are
    // unaffected either way — the first term is empty, which never
    // opens the panel.
    let firstSearchEmit = true;
    effect(() => {
      const search = this.searchInput();
      if (!search) {
        return;
      }
      const term = search.term();
      untracked(() => {
        if (firstSearchEmit) {
          firstSearchEmit = false;
          if (this.skipInitial()) {
            return;
          }
        }
        this.searchTermChange.emit(term);
        if (term !== '' && !this.panelOpen() && !this.disabled()) {
          this.open();
        }
      });
    });
  }

  // ── Public API ─────────────────────────────────────────────────────

  /** Open the panel. */
  open(): void {
    this.popoverRef()?.show();
  }

  /** Close the panel. */
  close(): void {
    this.popoverRef()?.hide();
  }

  /** Toggle the panel. */
  toggle(): void {
    this.popoverRef()?.toggle();
  }

  /** Focus the inline input. */
  focus(options?: FocusOptions): void {
    this.inputEl()?.nativeElement.focus(options);
  }

  // ── Event handlers ─────────────────────────────────────────────────

  /**
   * @internal — clicks anywhere inside the `role="group"` wrapper (on
   * padding, on a chip label, on the caret) should route focus into
   * the inline input so the user can keep typing. Clicks on the chip
   * remove button / clear-all already stopPropagation themselves.
   */
  protected handleWrapperClick(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, button, .cngx-chip__remove')) {
      return;
    }
    this.focus();
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
   * @internal — removal path shared by the default chip ✕ button and
   * `chipRemoveFor(opt)` callback.
   */
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
    this.maybeAnnounce(null, 'removed', 0);
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

  /**
   * @internal — input-level keys that the listbox-trigger can't reach.
   * Backspace-on-empty removes the trailing chip (native tag-input
   * parity). All other keys fall through to `CngxListboxTrigger`'s host
   * listener for Enter / Arrow / Home / End / Escape handling.
   */
  protected handleInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Backspace') {
      return;
    }
    const target = event.target as HTMLInputElement | null;
    if (target?.value !== '') {
      return;
    }
    const selected = this.selectedOptions();
    if (selected.length === 0) {
      return;
    }
    event.preventDefault();
    const last = selected[selected.length - 1];
    this.removeOption(last);
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
    this.maybeAnnounce(opt, isNowSelected ? 'added' : 'removed', this.values().length);
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
        if (
          !sameArrayContents(
            this.values(),
            finalValues,
            this.compareWith() as CompareFn<unknown>,
          )
        ) {
          this.values.set([...finalValues]);
        }
        const isNowSelected = finalValues.some((v) =>
          this.compareWith()(v, opt.value),
        );
        this.togglingOption.set(null);
        this.finalizeToggle(opt, isNowSelected);
      },
      onError: (err, rollbackTo) => {
        this.stateChange.emit('error');
        this.commitError.emit(err);
        if (mode === 'optimistic') {
          if (
            !sameArrayContents(
              this.values(),
              rollbackTo ?? [],
              this.compareWith() as CompareFn<unknown>,
            )
          ) {
            this.values.set([...(rollbackTo ?? [])]);
          }
        }
        this.announcer.announce(this.commitErrorMessage(err), 'assertive');
      },
    });
  }

  private beginCommitClear(
    previous: T[],
    action: CngxSelectCommitAction<T[]>,
  ): void {
    this.stateChange.emit('pending');
    const mode = this.commitMode();
    this.commitController.begin(action, [], previous, {
      onSuccess: (committed) => {
        this.stateChange.emit('success');
        const finalValues = committed ?? [];
        if (
          !sameArrayContents(
            this.values(),
            finalValues,
            this.compareWith() as CompareFn<unknown>,
          )
        ) {
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
        this.maybeAnnounce(null, 'removed', finalValues.length);
      },
      onError: (err, rollbackTo) => {
        this.stateChange.emit('error');
        this.commitError.emit(err);
        if (mode === 'optimistic') {
          if (
            !sameArrayContents(
              this.values(),
              rollbackTo ?? [],
              this.compareWith() as CompareFn<unknown>,
            )
          ) {
            this.values.set([...(rollbackTo ?? [])]);
          }
        }
        this.announcer.announce(this.commitErrorMessage(err), 'assertive');
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

  // ── Helpers ────────────────────────────────────────────────────────

  private findOption(value: T): CngxSelectOptionDef<T> | null {
    const map = this.valueToOptionMap();
    if (map) {
      return map.get(value as unknown) ?? null;
    }
    const eq = this.compareWith();
    return this.flatOptions().find((o) => eq(o.value, value)) ?? null;
  }

  private commitErrorMessage(err: unknown): string {
    const label = this.label() ?? this.ariaLabel() ?? 'Auswahl';
    const detail = err instanceof Error ? err.message : undefined;
    return detail
      ? `${label}: Speichern fehlgeschlagen — ${detail}`
      : `${label}: Speichern fehlgeschlagen`;
  }

  private maybeAnnounce(
    option: CngxSelectOptionDef<T> | null,
    action: 'added' | 'removed',
    count: number,
  ): void {
    const announcerConfig = this.config.announcer;
    const perInstance = this.announceChanges();
    const enabled = perInstance ?? announcerConfig.enabled ?? true;
    if (!enabled) {
      return;
    }
    const format = this.announceTemplate() ?? announcerConfig.format;
    const label = this.label();
    const ariaLabel = this.ariaLabel();
    let fieldLabel = 'Auswahl';
    if (label.length > 0) {
      fieldLabel = label;
    } else if (ariaLabel && ariaLabel.length > 0) {
      fieldLabel = ariaLabel;
    }
    const message = format({
      selectedLabel: option?.label ?? null,
      fieldLabel,
      multi: true,
      action,
      count,
    });
    this.announcer.announce(message, announcerConfig.politeness);
    void this.host;
  }
}

function sameArrayContents<T>(
  a: readonly T[],
  b: readonly T[],
  eq: CompareFn<unknown>,
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
