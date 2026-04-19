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
  isOptionDisabled,
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

/**
 * Change event emitted by {@link CngxMultiSelect.selectionChange}.
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
 * Multi-select sibling of {@link CngxSelect}. Uses the shared
 * {@link createSelectCore} factory for all stateless signal-graph
 * derivations — this component keeps only the multi-specific
 * trigger template, chip strip rendering, AD-activated dispatch,
 * typeahead-while-closed + PageUp/Down keyboard, and Field↔sync.
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
        inside a <button>. WAI-ARIA 1.2 pattern for multi-value comboboxes.
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
  styleUrls: ['../shared/select-base.css', './multi-select.component.css'],
})
export class CngxMultiSelect<T = unknown> implements CngxFormFieldControl {
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
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>('Auswahl zurücksetzen');
  readonly chipRemoveAriaLabel = input<string>('Entfernen');
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
  readonly values = model<T[]>([]);

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxMultiSelectChange<T>>();
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

  // ── Resolved template refs ─────────────────────────────────────────

  /** @internal */ protected readonly checkTpl = resolveTemplate(this.checkDirective, 'check');
  /** @internal */ protected readonly caretTpl = resolveTemplate(this.caretDirective, 'caret');
  /** @internal */ protected readonly optgroupTpl = resolveTemplate(this.optgroupDirective, 'optgroup');
  /** @internal */ protected readonly placeholderTpl = resolveTemplate(this.placeholderDirective, 'placeholder');
  /** @internal */ protected readonly emptyTpl = resolveTemplate(this.emptyDirective, 'empty');
  /** @internal */ protected readonly loadingTpl = resolveTemplate(this.loadingDirective, 'loading');
  /** Multi-specific trigger-label — replaces chip strip. @internal */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxMultiSelectTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** @internal */ protected readonly optionLabelTpl = resolveTemplate(this.optionLabelDirective, 'optionLabel');
  /** @internal */ protected readonly errorTpl = resolveTemplate(this.errorDirective, 'error');
  /** @internal */ protected readonly refreshingTpl = resolveTemplate(this.refreshingDirective, 'refreshing');
  /** @internal */ protected readonly commitErrorTpl = resolveTemplate(this.commitErrorDirective, 'commitError');
  /** Per-chip override. @internal */
  protected readonly chipTpl = computed<TemplateRef<CngxMultiSelectChipContext<T>> | null>(
    () => this.chipDirective()?.templateRef ?? null,
  );
  /** @internal */ protected readonly clearButtonTpl = resolveTemplate(this.clearButtonDirective, 'clearButton');
  /** @internal */ protected readonly optionPendingTpl = resolveTemplate(this.optionPendingDirective, 'optionPending');
  /** @internal */ protected readonly optionErrorTpl = resolveTemplate(this.optionErrorDirective, 'optionError');

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  // ── Public derived signals ─────────────────────────────────────────

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** @internal */
  readonly activeId = computed<string | null>(
    () => this.listboxRef()?.ad.activeId() ?? null,
  );

  // ── CngxFormFieldControl ───────────────────────────────────────────

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  readonly empty = computed<boolean>(() => this.isEmpty());

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // ── Core (stateless signal graph) ──────────────────────────────────

  /**
   * Signal-graph factory shared with {@link CngxSelect} and
   * {@link CngxCombobox}. Owns every derivation that's identical
   * across the family.
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
      multi: computed(() => true),
      currentSelection: this.values,
      multiValues: this.values,
      selectionIndicatorPosition: this.selectionIndicatorPosition,
      selectionIndicatorVariant: this.selectionIndicatorVariant,
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

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal — latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => this.retryCommit());

  /** Currently selected options. */
  readonly selected: Signal<readonly CngxSelectOptionDef<T>[]> = computed(
    () => this.selectedOptions(),
  );

  // ── Multi-selection state ──────────────────────────────────────────

  /**
   * Options currently selected, resolved from `values()` against
   * `flatOptions()`. Uses the core's O(1) map fast-path when
   * compareWith is the default.
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

  // ── Commit state (delegated) ───────────────────────────────────────

  private readonly commitController = this.core.commitController;
  private readonly togglingOption = this.core.togglingOption;

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /** @internal */
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
    return this.core.isSelected(opt.value);
  }

  protected isEmpty(): boolean {
    return this.values().length === 0;
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
            queueMicrotask(() => this.triggerBtn()?.nativeElement.focus());
          }
        }
      });
    });

    // Field → MultiSelect: mirror bound field value into our model.
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

    // MultiSelect → Field.
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
  }

  // ── Public API ─────────────────────────────────────────────────────

  open(): void { this.popoverRef()?.show(); }
  close(): void { this.popoverRef()?.hide(); }
  toggle(): void { this.popoverRef()?.toggle(); }
  focus(options?: FocusOptions): void { this.triggerBtn()?.nativeElement.focus(options); }

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal */
  protected handleTriggerClick(): void {
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

  /** @internal */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    return () => this.removeOption(opt);
  }

  /** Shared removal path for chip ✕ and slot callback. */
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
    // Typeahead-while-closed — toggle first matching option without opening.
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

    // PageUp / PageDown — open + jump ±10.
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
