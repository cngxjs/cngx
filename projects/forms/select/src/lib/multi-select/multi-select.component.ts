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
  CngxListboxTrigger,
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
  flattenSelectOptions,
  isCngxSelectOptionGroupDef,
  isOptionDisabled,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { resolveSelectConfig } from '../shared/resolve-config';
import { resolveTemplate } from '../shared/resolve-template';
import {
  CngxMultiSelectChip,
  type CngxMultiSelectChipContext,
  CngxMultiSelectTriggerLabel,
  type CngxMultiSelectTriggerLabelContext,
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
 * Change event emitted by {@link CngxMultiSelect.selectionChange} and the
 * per-toggle sibling outputs whenever a user action — not a programmatic
 * write — changes the selection array.
 *
 * `added` / `removed` carry the delta relative to the previous values.
 * Select-all and clear-all use the same shape so consumers can react to
 * every selection-shape change uniformly.
 *
 * @category interactive
 */
export interface CngxMultiSelectChange<T = unknown> {
  readonly source: CngxMultiSelect<T>;
  readonly values: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear' | 'select-all';
}

/**
 * Multi-select sibling to {@link CngxSelect}. Shares the panel body, option
 * model, commit-controller, announcer, and config surface with the single
 * variant — everything the Select family reuses lives under `shared/`.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-multi-select',
  exportAs: 'cngxMultiSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxChip,
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxMultiSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxMultiSelect);
        return { state: self.commitState };
      },
    },
    // Panel-host contract — panel sub-component injects this token, not the
    // concrete class, so the panel stays value-shape-agnostic and reusable
    // by any future select sibling.
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxMultiSelect },
  ],
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-multi-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      <!--
        role="combobox" with a focusable <div> — NOT a <button>. The
        trigger carries interactive children (chip × buttons, clear-all,
        custom chip-close slots) which would be invalid nested buttons
        inside a <button>. This shape is the WAI-ARIA 1.2 pattern for
        multi-value comboboxes.
      -->
      <div
        #triggerBtn
        class="cngx-multi-select__trigger"
        role="combobox"
        [cngxPopoverTrigger]="pop"
        [haspopup]="'listbox'"
        [cngxListboxTrigger]="lb"
        [popover]="pop"
        [closeOnSelect]="false"
        [attr.tabindex]="effectiveTabIndex()"
        [attr.aria-label]="triggerAria().label"
        [attr.aria-labelledby]="triggerAria().labelledBy"
        [attr.aria-describedby]="triggerAria().describedBy"
        [attr.aria-errormessage]="triggerAria().errorMessage"
        [attr.aria-expanded]="triggerAria().expanded"
        [attr.aria-disabled]="triggerAria().disabled"
        [attr.aria-invalid]="triggerAria().invalid"
        [attr.aria-required]="triggerAria().required"
        [attr.aria-busy]="triggerAria().busy"
        (click)="handleTriggerClick()"
        (focus)="handleFocus()"
        (blur)="handleBlur()"
        (keydown)="handleTriggerKeydown($event)"
      >
        <span class="cngx-select__chip-list">
          @if (isEmpty()) {
            @if (placeholderTpl(); as tpl) {
              <ng-container
                *ngTemplateOutlet="
                  tpl;
                  context: { $implicit: placeholder(), placeholder: placeholder() }
                "
              />
            } @else {
              <span class="cngx-multi-select__placeholder">
                {{ placeholder() || label() }}
              </span>
            }
          } @else if (triggerLabelTpl(); as tpl) {
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
          } @else {
            @for (opt of selectedOptions(); track opt.value) {
              @if (chipTpl(); as tpl) {
                <ng-container
                  *ngTemplateOutlet="
                    tpl;
                    context: {
                      $implicit: opt,
                      option: opt,
                      remove: chipRemoveFor(opt)
                    }
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
          }
        </span>
        @if (clearable() && !isEmpty() && !disabled()) {
          @if (clearButtonTpl(); as tpl) {
            <span class="cngx-multi-select__clear-slot" (click)="$event.stopPropagation()">
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
              class="cngx-multi-select__clear-all"
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
            <span aria-hidden="true" class="cngx-multi-select__caret">&#9662;</span>
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
  // Structural CSS (panel frame, option rows, skeletons, spinners,
  // shimmer/refresh animations, error surfaces) is shared with CngxSelect
  // via shared/select-base.css. This file owns only the multi-specific
  // trigger + chip skin.
  styleUrls: ['../shared/select-base.css', './multi-select.component.css'],
})
export class CngxMultiSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly config = resolveSelectConfig();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // ── Inputs ─────────────────────────────────────────────────────────

  /** Accessible label for the listbox region and fallback trigger name. */
  readonly label = input<string>('');

  /** Options in data-driven mode (flat or grouped). */
  readonly options = input<CngxSelectOptionsInput<T>>([] as CngxSelectOptionsInput<T>);

  /** Placeholder shown on the trigger when no value is selected. */
  readonly placeholder = input<string>('');

  /** Disabled state. Merges with `presenter.disabled()` if inside a form-field. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Required state. Merges with `presenter.required()` if inside a form-field. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** Equality function used to match values to options. Defaults to `Object.is`. */
  readonly compareWith = input<CompareFn<T>>(defaultCompare as CompareFn<T>);

  /** Custom id. Defaults to the presenter-generated ID inside form-field, else auto. */
  readonly idInput = input<string | null>(null, { alias: 'id' });

  /** Explicit `aria-label` on the trigger. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Explicit `aria-labelledby` on the trigger. */
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Trigger tab index. Defaults to `0`. */
  readonly tabIndex = input<number>(0);

  /** One-shot autofocus on first render. Matches native `<select autofocus>` semantics. */
  readonly autofocus = input<boolean>(false);

  /** Classes applied to the panel root. Merged with the library default. */
  readonly panelClass = input<string | readonly string[] | null>(null);

  /** Panel width strategy. */
  readonly panelWidth = input<'trigger' | number | null>(this.config.panelWidth);

  /** Typeahead debounce override. */
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);

  /** Hide the default in-panel checkmark on this instance. */
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);

  /** Hide the default dropdown caret glyph. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /** Render a clear-all button when at least one value is selected. */
  readonly clearable = input<boolean>(false);

  /** A11y label for the clear-all button. */
  readonly clearButtonAriaLabel = input<string>('Auswahl zurücksetzen');

  /** A11y label prefix for the per-chip remove button. Final label is `${prefix}: ${optionLabel}`. */
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

  /** Callback invoked when the user clicks the default retry-button in the error panel. */
  readonly retryFn = input<(() => void) | null>(null);

  /**
   * Async write handler invoked per toggle. Receives the full next values
   * array (with the toggled option added or removed) and returns the
   * committed array. Supersede semantics apply for rapid toggles.
   */
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);

  /**
   * Commit UX mode:
   *
   * - `'optimistic'` (default): values are updated immediately on toggle
   *   and rolled back on error.
   * - `'pessimistic'`: values stay at the previous array until commit
   *   success; the toggled option shows a pending spinner.
   */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');

  /**
   * Where `commitAction` errors render in the absence of a
   * `*cngxSelectCommitError` template. Falls back to config default.
   */
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

  /** Fires on user-driven selection changes (not on programmatic writes). */
  readonly selectionChange = output<CngxMultiSelectChange<T>>();

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

  // ── Content-child directive queries (field-init — Angular requires this pattern) ──

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly triggerLabelDirective = contentChild<CngxMultiSelectTriggerLabel<T>>(
    CngxMultiSelectTriggerLabel,
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
  private readonly chipDirective = contentChild<CngxMultiSelectChip<T>>(CngxMultiSelectChip);
  private readonly clearButtonDirective =
    contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective = contentChild<CngxSelectOptionPending<T>>(
    CngxSelectOptionPending,
  );
  private readonly optionErrorDirective = contentChild<CngxSelectOptionError<T>>(
    CngxSelectOptionError,
  );

  // ── Resolved template refs (3-stage cascade via resolveTemplate helper) ──

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
   * Multi-specific trigger-label — replaces the whole chip strip when
   * projected. Multi doesn't route through `resolveTemplate`: its
   * context shape (`CngxMultiSelectTriggerLabelContext`) differs from
   * the single-select variant and has no matching global config key.
   * Add one if a real consumer requests global overrides.
   *
   * @internal
   */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxMultiSelectTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** @internal */
  protected readonly optionLabelTpl = resolveTemplate(this.optionLabelDirective, 'optionLabel');
  /** @internal */
  protected readonly errorTpl = resolveTemplate(this.errorDirective, 'error');
  /** @internal */
  protected readonly refreshingTpl = resolveTemplate(this.refreshingDirective, 'refreshing');
  /** @internal */
  protected readonly commitErrorTpl = resolveTemplate(this.commitErrorDirective, 'commitError');
  /**
   * Per-chip override. No global config fallback: chip shape is
   * multi-specific and the library default is `<cngx-chip>` from
   * `@cngx/common/display`, styled via CSS custom properties rather
   * than a template swap.
   *
   * @internal
   */
  protected readonly chipTpl = computed<TemplateRef<CngxMultiSelectChipContext<T>> | null>(
    () => this.chipDirective()?.templateRef ?? null,
  );
  /** @internal */
  protected readonly clearButtonTpl = resolveTemplate(this.clearButtonDirective, 'clearButton');
  /** @internal */
  protected readonly optionPendingTpl = resolveTemplate(this.optionPendingDirective, 'optionPending');
  /** @internal */
  protected readonly optionErrorTpl = resolveTemplate(this.optionErrorDirective, 'optionError');
  /** @internal — latest commit error routed to optionErrorTpl context. */
  readonly commitErrorValue = computed<unknown>(() => this.commitState.error());

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  // ── Public Signals ─────────────────────────────────────────────────

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /**
   * DOM id of the option currently highlighted via `CngxActiveDescendant`,
   * or `null` when nothing is highlighted. Exposed through the
   * panel-host contract so the panel's option-row template can pass a
   * real `highlighted` flag into `*cngxSelectOptionLabel` contexts.
   *
   * @internal
   */
  readonly activeId = computed<string | null>(
    () => this.listboxRef()?.ad.activeId() ?? null,
  );

  /** Currently selected options, resolved against the option list. */
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
  protected readonly ariaBusy = computed(() => (this.presenter?.pending() ? true : null));
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
   * @internal — bundled ARIA projection for the trigger button.
   *
   * Mirrors {@link CngxSelect.triggerAria} — one named bundle so the
   * template (and any ejected consumer via Atomic-Decompose) reads from
   * a single source instead of a scattered `[attr.aria-*]` list.
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

  /** @internal */
  protected readonly effectiveOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const s = this.state();
    const fromState = s?.data();
    if (fromState) {
      return fromState;
    }
    return this.options();
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
   * `flatOptions()`. Used by the trigger's chip list and by the
   * announcer. Element-wise identity-equal so stable selections don't
   * re-render chips.
   */
  protected readonly selectedOptions = computed<CngxSelectOptionDef<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
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

  /**
   * Per-toggle commit controller. Every toggle snapshots the pre-toggle
   * values array as rollback target, runs the action with the *next*
   * values array, and supersedes any in-flight commit. The controller is
   * the single source of truth for `commitState`, `isCommitting`, and
   * the `intendedValue` signal (used to look up the option currently
   * being committed).
   */
  private readonly commitController: CngxCommitController<T[]> =
    inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY)<T[]>();

  /** Read-only view of the commit lifecycle. */
  readonly commitState: CngxAsyncState<T[] | undefined> = this.commitController.state;

  /** `true` while a commit is in flight. */
  readonly isCommitting: Signal<boolean> = this.commitController.isCommitting;

  /**
   * The option the user just toggled — drives the per-row pending spinner
   * and supplies the `option` field of the commit-error context. Stored
   * separately from `commitController.intendedValue` because the
   * controller holds the FULL next array, not the single option.
   */
  private readonly togglingOption = signal<CngxSelectOptionDef<T> | null>(null);

  /**
   * Rollback target for a commit in flight — the full values array
   * captured at the moment of activation. Read at commit-start time,
   * written only from the AD-activated subscriber so the effect loop
   * stays flat.
   */
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

  /**
   * @internal — true for the specific option currently being committed.
   * Drives the per-option pending spinner in the panel.
   */
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
  protected readonly triggerText = computed<string>(() => {
    const count = this.selectedOptions().length;
    if (count === 0) {
      return this.placeholder() || this.label();
    }
    return this.selectedOptions()
      .map((o) => o.label)
      .join(', ');
  });

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
    const eq = this.compareWith();
    return vals.some((v) => eq(v, opt.value));
  }

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  constructor() {
    // Seed the rollback target synchronously so a first-toggle error
    // rolls back to the bound initial array (not `[]`).
    this.lastCommittedValues = untracked(() => [...this.values()]);

    // `values` binds directly to the listbox's `[(selectedValues)]` now
    // that CngxListbox is generic over T. No adapter, no sync effects —
    // the listbox model and our model are the same signal under the hood.

    // Honor [autofocus] on first render — one-shot DOM side effect,
    // matches native <select autofocus> semantics.
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Bridge AD-activations into user-selection outputs and (when bound)
    // the commit flow.
    //
    // AD-order invariant:
    //   externalActivation()=true  → listbox suppresses its own write on
    //     activation. `values()` is still the pre-toggle array when our
    //     handler runs; we compute the next array, snapshot previous,
    //     run the commit flow.
    //   externalActivation()=false → listbox auto-toggles selectedValues
    //     before our handler fires (same-tick Subject emit). We emit
    //     outputs + announce; values has already been updated.
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
          // No commit-action: listbox already toggled selectedValues; emit
          // outputs based on the observed membership delta.
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
            queueMicrotask(() => this.triggerBtn()?.nativeElement.focus());
          }
        }
      });
    });

    // Field → MultiSelect: mirror bound field value (expected T[]) into our model.
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

    // MultiSelect → Field: push selection back into bound field.
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

  /** Focus the trigger button. */
  focus(options?: FocusOptions): void {
    this.triggerBtn()?.nativeElement.focus(options);
  }

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal */
  protected handleTriggerClick(): void {
    // <button disabled> blocks clicks natively; <div role="combobox">
    // does not, so the check lives in the handler.
    if (this.disabled()) {
      return;
    }
    this.toggle();
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
   * @internal — returns the `remove` callback supplied to the
   * `*cngxMultiSelectChip` template context. Thin wrapper so the
   * consumer template can `(click)="remove()"` without knowing about
   * the commit routing; kept as a method (not a cached-per-option Map)
   * because the closure allocation is trivial against the chip loop's
   * natural cadence.
   */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    return () => this.removeOption(opt);
  }

  /**
   * @internal — shared removal path used by the default chip ✕ button
   * and by the `remove()` callback exposed on the chip-template context.
   * Routes through the commit flow when `[commitAction]` is bound;
   * otherwise simply drops the value from `values()` and emits outputs.
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

  /**
   * @internal — imperative clear-all path exposed to the
   * `*cngxSelectClearButton` template context. Same outcome as the
   * default ✕ button: commit flow when `[commitAction]` is bound,
   * otherwise direct values reset + outputs + announce.
   *
   * Stable reference so `ngTemplateOutlet` doesn't re-stamp the slot
   * on every change-detection cycle.
   */
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
    if (this.config.openOn === 'focus' || this.config.openOn === 'click+focus') {
      this.open();
    }
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.presenter?.fieldState().markAsTouched();
  }

  /** @internal */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    // Typeahead-while-closed — native <select multiple> parity: the
    // first matching option is TOGGLED (added if absent, removed if
    // present) without opening the panel.
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        event.preventDefault();
        const flat = this.flatOptions();
        const lower = key.toLowerCase();
        for (const candidate of flat) {
          if (candidate.disabled) {
            continue;
          }
          if (candidate.label.toLowerCase().startsWith(lower)) {
            this.toggleOptionByUser(candidate);
            return;
          }
        }
      }
    }

    // PageUp / PageDown — open and jump ±10 (clamped, skipping disabled).
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      const lb = this.listboxRef();
      const pop = this.popoverRef();
      if (!pop || !lb) {
        return;
      }
      if (!pop.isVisible()) {
        pop.show();
      }
      const options = lb.options();
      const total = options.length;
      if (total === 0) {
        return;
      }
      const ad = lb.ad;
      const direction = event.key === 'PageDown' ? 1 : -1;
      const step = 10 * direction;
      const currentId = ad.activeId();
      const currentIdx = options.findIndex((o) => o.id === currentId);
      let target = Math.max(0, Math.min(total - 1, (currentIdx < 0 ? 0 : currentIdx) + step));
      while (isOptionDisabled(options[target]) && target > 0 && target < total - 1) {
        target += direction;
      }
      if (isOptionDisabled(options[target])) {
        let probe = target - direction;
        while (probe >= 0 && probe < total && isOptionDisabled(options[probe])) {
          probe -= direction;
        }
        if (probe >= 0 && probe < total) {
          target = probe;
        } else {
          return;
        }
      }
      ad.highlightByIndex(target);
    }
  }

  // ── Commit orchestration ───────────────────────────────────────────

  /**
   * @internal — toggle a single option via the user-intent path (not
   * programmatic). Used by typeahead-while-closed and chip-X. Shares the
   * commit routing with the AD-activated path.
   */
  private toggleOptionByUser(opt: CngxSelectOptionDef<T>): void {
    const action = this.commitAction();
    const previous = [...this.values()];
    const eq = this.compareWith();
    const wasSelected = previous.some((v) => eq(v, opt.value));
    const next = wasSelected
      ? previous.filter((v) => !eq(v, opt.value))
      : [...previous, opt.value];
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
    this.finalizeToggle(opt, !wasSelected);
  }

  /**
   * @internal — emit the user-facing outputs for a settled toggle.
   * Called directly in the non-commit path and on commit success.
   */
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

  /**
   * @internal — start a commit for a single toggle. Controller owns
   * lifecycle + supersede; this method maps outcomes into the
   * component's outputs, values signal, and announcer.
   */
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
          // Rollback to the pre-toggle array.
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
        // Pessimistic: values stayed at previous the whole time.
        this.announcer.announce(this.commitErrorMessage(err), 'assertive');
        // Panel stays open in multi; togglingOption stays set so the
        // commit-error banner/inline indicator can reference the option.
      },
    });
  }

  /**
   * @internal — start a commit for a clear-all action. Same supersede
   * semantics as a single toggle; on success emits `cleared` and a
   * selectionChange with `action: 'clear'`.
   */
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

  /** @internal — replay the last failed commit with the same intended next-array. */
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
    // Multi-specific announcer payload: the formatter receives the
    // toggle direction + the resulting selection count so AT users hear
    // "Rot hinzugefügt, 2 ausgewählt" rather than just the label.
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
