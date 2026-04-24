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

import { CngxChip } from '@cngx/common/display';
import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
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
import {
  createTypeaheadController,
  resolvePageJumpTarget,
} from '../shared/typeahead-controller';
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
  isOptionDisabled,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { resolveSelectConfig } from '../shared/resolve-config';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
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
  /**
   * Values before the change was committed. Populated from the pre-
   * toggle snapshot in the AD-activation callback, from the commit-
   * controller's rollback target on success, and from the pre-clear
   * array in the clear path. Plural name to disambiguate from the
   * scalar `previousValue` on `CngxSelectChange` / `CngxTypeaheadChange`.
   */
  readonly previousValues?: readonly T[];
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
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxMultiSelect },
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
      @let aria = triggerAria();
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
        [attr.aria-label]="aria.label"
        [attr.aria-labelledby]="aria.labelledBy"
        [attr.aria-describedby]="aria.describedBy"
        [attr.aria-errormessage]="aria.errorMessage"
        [attr.aria-expanded]="aria.expanded"
        [attr.aria-disabled]="aria.disabled"
        [attr.aria-invalid]="aria.invalid"
        [attr.aria-required]="aria.required"
        [attr.aria-busy]="aria.busy"
        (click)="handleTriggerClick()"
        (focus)="handleFocus()"
        (blur)="handleBlur()"
        (keydown)="handleTriggerKeydown($event)"
      >
        <span class="cngx-select__chip-list">
          @if (isEmpty()) {
            @if (tpl.placeholder(); as phTpl) {
              <ng-container
                *ngTemplateOutlet="
                  phTpl;
                  context: { $implicit: placeholder(), placeholder: placeholder() }
                "
              />
            } @else {
              <span class="cngx-multi-select__placeholder">
                {{ placeholder() || label() }}
              </span>
            }
          } @else if (triggerLabelTpl(); as triggerTpl) {
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
          } @else {
            @for (opt of selectedOptions(); track opt.value) {
              @if (chipTpl(); as chipT) {
                <ng-container
                  *ngTemplateOutlet="
                    chipT;
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
          @if (tpl.clearButton(); as clearBtnTpl) {
            <span class="cngx-multi-select__clear-slot" (click)="$event.stopPropagation()">
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
              class="cngx-multi-select__clear-all"
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
            <span aria-hidden="true" class="cngx-multi-select__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-multi-select__caret">&#9662;</span>
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
  /**
   * Popover placement relative to the trigger. Per-instance input
   * wins over {@link CngxSelectConfig.popoverPlacement}.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(null);
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
  /** Multi-specific trigger-label — replaces chip strip. @internal */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxMultiSelectTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);
  /** Per-chip override. @internal */
  protected readonly chipTpl = computed<TemplateRef<CngxMultiSelectChipContext<T>> | null>(
    () => this.chipDirective()?.templateRef ?? null,
  );

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

  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal */ readonly focused = this.focusState.focused;

  readonly empty = computed<boolean>(() => this.isEmpty());

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

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

  /**
   * Keyboard typeahead engine — shared with the rest of the select
   * family via `@cngx/forms/select/shared/typeahead-controller`.
   * Buffered multi-char resolve + disabled-skip are identical to single
   * select; the match-to-action wiring below is multi-specific (toggle).
   */
  private readonly typeaheadController = createTypeaheadController<T>({
    options: this.flatOptions,
    compareWith: this.compareWith,
    debounceMs: this.typeaheadDebounceInterval,
    disabled: this.disabled,
  });

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal — latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() => this.commitHandler.retryLast());

  /**
   * Currently selected options. Structurally compared by `.value`
   * under `compareWith` so a fresh OptionDef reference carrying the
   * same values does not cascade re-renders on consumer bindings.
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

  private readonly togglingOption = this.core.togglingOption;

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

  /**
   * Commit-flow handler — owns the commit-controller lifecycle, value
   * reconciliation, rollback-on-error, and live-region announcements.
   * Shared with `CngxCombobox` via `shared/array-commit-handler.ts`.
   * Consumer retains emission of selection-change payloads via the
   * finalize callbacks (value-shape-specific).
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

  protected isIndeterminate(opt: CngxSelectOptionDef<T>): boolean {
    return this.core.isIndeterminate(opt.value);
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
        // Values have already been mutated by the listbox. Reconstruct
        // the pre-toggle snapshot by inverting the change:
        //   currentSelected=true  → opt was added    → previous = current \ {opt}
        //   currentSelected=false → opt was removed  → previous = current ∪ {opt}
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
      restoreFocusTarget: this.triggerBtn,
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
    if (this.config.openOn === 'focus' || this.config.openOn === 'click+focus') {
      this.open();
    }
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusState.markBlurred();
    this.presenter?.fieldState().markAsTouched();
  }

  /** @internal */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    // Typeahead-while-closed — toggle first matching option via the
    // shared typeahead controller (multi-char buffering + disabled skip).
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        const candidate = this.typeaheadController.matchFromIndex(key, -1);
        if (candidate) {
          event.preventDefault();
          this.toggleOptionByUser(candidate);
          // Multi-select toggle semantics: every keystroke should map to
          // an independent toggle. Reset the buffer so a repeated key
          // toggles the same option back off instead of accumulating
          // ('rr' would match nothing). Single-select keeps buffering
          // because its advance-on-repeat is the desired jump behaviour.
          this.typeaheadController.clearBuffer();
          return;
        }
      }
    }

    // PageUp / PageDown — open + jump ±10 with disabled-aware clamping.
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
      const ad = lb.ad;
      const currentId = ad.activeId();
      const currentIdx = options.findIndex((o) => o.id === currentId);
      const direction: 1 | -1 = event.key === 'PageDown' ? 1 : -1;
      const target = resolvePageJumpTarget(options, currentIdx, direction, (o) =>
        isOptionDisabled(o),
      );
      if (target !== null) {
        ad.highlightByIndex(target);
      }
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
      this.commitHandler.beginToggle(next, previous, opt, action);
      return;
    }
    this.values.set(next);
    this.finalizeToggle(opt, !wasSelected, previous);
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

