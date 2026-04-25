import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  Injector,
  input,
  model,
  output,
  untracked,
  viewChild,
  type ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import { CNGX_STATEFUL, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

import { CngxChip } from '@cngx/common/display';
import {
  CNGX_CHIP_STRIP_ROVING_FACTORY,
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
  CngxReorder,
  type CngxReorderEvent,
  type CngxReorderModifier,
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
import {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
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
  type CngxSelectConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import {
  isOptionDisabled,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_REORDER_COMMIT_HANDLER_FACTORY } from '../shared/reorder-commit-handler';
import { resolveReorderableSelectConfig } from '../shared/reorderable-select-config';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { resolveSelectConfig } from '../shared/resolve-config';
import { setupVirtualization } from '../shared/setup-virtualization';
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
 * Change event emitted by {@link CngxReorderableMultiSelect.selectionChange}
 * and {@link CngxReorderableMultiSelect.reordered}. The `'reorder'` action
 * branch carries `fromIndex` / `toIndex`; the other branches leave them
 * `undefined`, matching the flat-family change-shape.
 *
 * @category interactive
 */
export interface CngxReorderableMultiSelectChange<T = unknown> {
  readonly source: CngxReorderableMultiSelect<T>;
  readonly values: readonly T[];
  readonly previousValues?: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly option: CngxSelectOptionDef<T> | null;
  readonly action: 'toggle' | 'clear' | 'reorder';
  readonly fromIndex?: number;
  readonly toIndex?: number;
}

/**
 * Multi-select variant that lets the user reorder the selected values
 * via pointer drag and keyboard moves (configurable modifier + arrow,
 * Home / End). All non-reorder surface — option model, panel, commit
 * lifecycle, Field↔sync, announcer, trigger ARIA — reuses the shared
 * {@link createSelectCore} factory and the same template slots as
 * {@link CngxMultiSelect} (`*cngxMultiSelectChip`,
 * `*cngxMultiSelectTriggerLabel`, `*cngxSelectClearButton`, …). Reorder
 * commits bypass `createArrayCommitHandler.beginToggle` — the handler's
 * `sameArrayContents` guard would skip the write on same-membership
 * reorders — and talk to the commit controller directly, mirroring
 * {@link /projects/forms/select/src/lib/tree-select/tree-select.component.ts
 * CngxTreeSelect.dispatchValueChange}.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-reorderable-multi-select',
  exportAs: 'cngxReorderableMultiSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxChip,
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxReorder,
    CngxSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxReorderableMultiSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxReorderableMultiSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxReorderableMultiSelect },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxReorderableMultiSelect },
  ],
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-reorderable-multi-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      @let aria = triggerAria();
      <div
        #triggerBtn
        class="cngx-reorderable-multi-select__trigger"
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
        <!--
          Chip strip. cngxReorder is bound with the read-only view of
          values() -- its items input wants a Signal reference, not
          the evaluated array. Roving tabindex is inlined (see
          handleStripKeydown + activeChipIndex) to avoid a double-fire
          with CngxReorder's modifier-gated handler on the same host.
        -->
        <span
          class="cngx-select__chip-list"
          [class.cngx-select__chip-list--reordering]="reorderDir.dragging()"
          [attr.data-overflow]="effectiveChipOverflow()"
          role="group"
          [attr.aria-label]="reorderAriaLabel()"
          [attr.aria-disabled]="reorderDisabled() ? 'true' : null"
          [cngxReorder]="valuesSignal"
          [disabled]="reorderDisabled()"
          [keyboardModifier]="reorderKeyboardModifier()"
          handleSelector="[data-reorder-index]"
          ignoreSelector="button, a, input, [contenteditable], [cngxChipClose]"
          #reorderDir="cngxReorder"
          (reordered)="handleReorder($event)"
          (keydown)="handleStripKeydown($event)"
        >
          @if (isEmpty()) {
            @if (tpl.placeholder(); as phTpl) {
              <ng-container
                *ngTemplateOutlet="
                  phTpl;
                  context: { $implicit: placeholder(), placeholder: placeholder() }
                "
              />
            } @else {
              <span class="cngx-reorderable-multi-select__placeholder">
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
            @for (opt of selectedOptions(); track opt.value; let i = $index) {
              <span
                class="cngx-select__chip-wrap"
                [class.cngx-select__chip--dragging]="reorderDir.dragFromIndex() === i"
                [class.cngx-select__chip--drag-over]="
                  reorderDir.dragOverIndex() === i &&
                  reorderDir.dragFromIndex() !== i
                "
                [attr.data-reorder-index]="i"
                [attr.tabindex]="i === activeChipIndex() ? 0 : -1"
                (focus)="handleChipFocus(i)"
                (click)="$event.stopPropagation()"
              >
                @if (chipDragHandleTpl(); as handleT) {
                  <span class="cngx-select__chip-handle" aria-hidden="true">
                    <ng-container *ngTemplateOutlet="handleT" />
                  </span>
                }
                @if (chipTpl(); as chipT) {
                  <ng-container
                    *ngTemplateOutlet="
                      chipT;
                      context: {
                        $implicit: opt,
                        option: opt,
                        remove: chipRemoveFor(opt),
                        index: i
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
              </span>
            }
          }
        </span>
        @if (clearable() && !isEmpty() && !disabled()) {
          @if (tpl.clearButton(); as clearBtnTpl) {
            <span
              class="cngx-reorderable-multi-select__clear-slot"
              (click)="$event.stopPropagation()"
            >
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
              class="cngx-reorderable-multi-select__clear-all"
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
            <span aria-hidden="true" class="cngx-reorderable-multi-select__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-reorderable-multi-select__caret">&#9662;</span>
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
          [virtualCount]="virtualItemCount()"
          [(selectedValues)]="values"
        >
          <cngx-select-panel #panelRef="cngxSelectPanel" />
        </div>
      </div>
    </div>
  `,
  styleUrls: [
    '../shared/select-base.css',
    './reorderable-multi-select.component.css',
  ],
})
export class CngxReorderableMultiSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();
  private readonly reorderableConfig = resolveReorderableSelectConfig();
  private readonly injector = inject(Injector);

  // ── Inputs (shared with CngxMultiSelect) ───────────────────────────

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
  /**
   * Chip-strip overflow strategy. Reorderable enforces that all
   * chips remain in the DOM (drag-reorder requires it) — a
   * `'truncate'` value is silently downgraded to `'scroll-x'` via
   * {@link effectiveChipOverflow}. `'wrap'` (default) and
   * `'scroll-x'` pass through unchanged.
   */
  readonly chipOverflow = input<NonNullable<CngxSelectConfig['chipOverflow']>>(
    this.config.chipOverflow,
  );
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);
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
  readonly values = model<T[]>([]);

  // ── Inputs (reorder-specific) ──────────────────────────────────────

  /**
   * Modifier key required for keyboard-driven reorder moves. Plain arrow
   * keys keep their default meaning (roving focus across chips); only
   * modifier + arrow emits a reorder. Forwarded to the inner
   * {@link CngxReorder} directive. Default comes from
   * `provideReorderableSelectConfig(withReorderKeyboardModifier(...))`
   * — fall-through when neither is set: `'ctrl'`.
   */
  readonly reorderKeyboardModifier = input<CngxReorderModifier>(
    this.reorderableConfig.keyboardModifier,
  );

  /**
   * ARIA label for the chip-strip region. Announced by screen readers
   * when the user tabs into the strip so they understand they're
   * entering a reorderable widget. Default cascades through
   * `provideReorderableSelectConfig(withReorderAriaLabel(...))`.
   */
  readonly reorderAriaLabel = input<string>(this.reorderableConfig.ariaLabel);

  /**
   * Custom drag-handle glyph. When projected, replaces the default
   * six-dot grip `⋮⋮` rendered before each chip body. Consumer owns
   * icon choice and ARIA — the handle span stays `aria-hidden="true"`
   * because the semantic move is owned by the chip wrapper's keyboard
   * handler + the directive, not the handle itself. Default cascades
   * through `provideReorderableSelectConfig(withDefaultDragHandle(...))`.
   */
  readonly chipDragHandle = input<TemplateRef<void> | null>(
    this.reorderableConfig.dragHandle,
  );

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxReorderableMultiSelectChange<T>>();
  readonly optionToggled = output<{
    readonly option: CngxSelectOptionDef<T>;
    readonly added: boolean;
  }>();
  /**
   * Dedicated channel for reorder events. Consumers that only care
   * about positional changes can bind `(reordered)` without having to
   * branch on `change.action === 'reorder'`. Always fires *after*
   * `selectionChange` with the same payload.
   */
  readonly reordered = output<CngxReorderableMultiSelectChange<T>>();
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

  /** @internal */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxMultiSelectTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);

  /** @internal */
  protected readonly chipTpl = computed<TemplateRef<CngxMultiSelectChipContext<T>> | null>(
    () => this.chipDirective()?.templateRef ?? null,
  );

  /** @internal */
  protected readonly chipDragHandleTpl = computed<TemplateRef<void> | null>(
    () => this.chipDragHandle(),
  );

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  // ── Public derived signals ─────────────────────────────────────────

  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** @internal */
  readonly activeId = computed<string | null>(
    () => this.listboxRef()?.ad.activeId() ?? null,
  );

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

  // ── Typeahead-while-closed ─────────────────────────────────────────

  private readonly typeaheadController = createTypeaheadController<T>({
    options: this.flatOptions,
    compareWith: this.compareWith,
    debounceMs: this.typeaheadDebounceInterval,
    disabled: this.disabled,
  });

  // ── Commit state (shared with the flat family) ─────────────────────

  readonly commitState = this.core.commitState;
  readonly isCommitting = this.core.isCommitting;
  /** @internal */ readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(
    () => this.commitHandler.retryLast(),
  );

  /** @internal — full virtualisation wire-up (see setupVirtualization). */
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

  private readonly togglingOption = this.core.togglingOption;

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = [];

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
   * Chip-removal handler — same factory as `CngxMultiSelect`/`CngxCombobox`.
   * Reorder semantics are independent: chip-remove is always a single
   * deselect (the strip-keyboard handler owns position changes via
   * `CngxReorder`).
   */
  private readonly chipRemovalHandler: CngxChipRemovalHandler<CngxSelectOptionDef<T>> =
    inject(CNGX_CHIP_REMOVAL_HANDLER_FACTORY)<T>({
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
      onSyncFinalize: (item, previous) =>
        this.finalizeToggle(item, false, previous),
    });

  // ── Reorder-specific state ─────────────────────────────────────────

  /**
   * Read-only signal view of `values()` passed to
   * {@link CngxReorder.items}. The directive expects a Signal reference
   * (not the evaluated array) so it can read the freshest order at
   * drag-start and at keyboard-move time without subscribing to every
   * model-change tick.
   */
  protected readonly valuesSignal: Signal<readonly T[]> = this.values.asReadonly();

  /**
   * Container host for the chip-strip roving controller's element
   * lookups. Read lazily — the `viewChild()` signal is `undefined`
   * until the first render completes, which is fine because the
   * controller only reads it inside `focusAt()` at user-event time.
   */
  private readonly stripContainer = computed<HTMLElement | null>(
    () => this.triggerBtn()?.nativeElement ?? null,
  );

  /**
   * Chip-strip focus controller. Owns the `activeChipIndex` signal, the
   * plain-arrow keydown handler, and the count-shrink clamp. Swap-able
   * via `CNGX_CHIP_STRIP_ROVING_FACTORY` without forking the component.
   */
  private readonly chipStripRoving = inject(CNGX_CHIP_STRIP_ROVING_FACTORY)({
    count: computed(() => this.selectedOptions().length),
    container: this.stripContainer,
  });

  /** @internal */
  protected readonly activeChipIndex = this.chipStripRoving.activeIndex;

  /**
   * Pointer / keyboard reorder is suppressed while a commit is in
   * flight (pessimistic freeze — default) or when the component is
   * disabled. App-wide `provideReorderableSelectConfig(withReorderStripFreeze(false))`
   * opts out of the freeze so consecutive reorders supersede any
   * in-flight commit via the commit-controller's built-in race
   * handling. Plan §2 locked the freeze default — reorders are
   * sub-second and a freeze is clearer than mid-gesture visual noise.
   */
  /**
   * Effective overflow mode after safety downgrade —
   * `'truncate'` is unsafe for drag-reorder (hidden chips break
   * `cngxReorder`'s DOM-scan) so it always becomes `'scroll-x'`.
   * Pass `'wrap'` or `'scroll-x'` unchanged.
   *
   * @internal
   */
  protected readonly effectiveChipOverflow = computed<
    'wrap' | 'scroll-x'
  >(() => {
    const mode = this.chipOverflow();
    return mode === 'truncate' ? 'scroll-x' : mode;
  });

  protected readonly reorderDisabled = computed<boolean>(() => {
    if (this.disabled()) {
      return true;
    }
    if (this.reorderableConfig.freezeStripOnCommit && this.isCommitting()) {
      return true;
    }
    return false;
  });

  // ── Panel-host surface ─────────────────────────────────────────────
  /** @internal */ protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */ protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */ protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */ protected readonly isCommittingOption = this.core.panelHostAdapter.isCommittingOption;

  protected isEmpty(): boolean {
    return this.values().length === 0;
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

    // Open / close lifecycle + focus restore.
    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.triggerBtn,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
    });

    // Activeindex clamp on count shrink is owned by the chip-strip
    // roving controller (installed via `CNGX_CHIP_STRIP_ROVING_FACTORY`).

    createFieldSync<T[]>({
      componentValue: this.values,
      valueEquals: (a, b) => sameArrayContents(a, b, this.compareWith()),
      coerceFromField: (x) => (Array.isArray(x) ? [...(x as T[])] : []),
      toFieldValue: (v) => [...v],
    });
  }

  // ── Public API ─────────────────────────────────────────────────────

  open(): void { this.popoverRef()?.show(); }
  close(): void { this.popoverRef()?.hide(); }
  toggle(): void { this.popoverRef()?.toggle(); }
  focus(options?: FocusOptions): void { this.triggerBtn()?.nativeElement.focus(options); }

  // ── Event handlers (shared with CngxMultiSelect) ───────────────────

  /** @internal */
  protected handleTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggle();
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
    this.chipRemovalHandler.removeByValue(opt);
  }

  /** @internal — stable per-option `remove()` closure for chip slots. */
  protected chipRemoveFor(opt: CngxSelectOptionDef<T>): () => void {
    return this.chipRemovalHandler.removeFor(opt);
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
    // Typeahead-while-closed.
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        const candidate = this.typeaheadController.matchFromIndex(key, -1);
        if (candidate) {
          event.preventDefault();
          this.toggleOptionByUser(candidate);
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

  // ── Chip-strip roving + reorder glue ───────────────────────────────

  /**
   * Chip-wrapper `(focus)` delegate — keeps the roving controller in
   * sync when the user Tabs into the strip or clicks a chip directly.
   *
   * @internal
   */
  protected handleChipFocus(index: number): void {
    this.chipStripRoving.markFocused(index);
  }

  /**
   * Chip-strip keydown delegate. Two responsibilities:
   *
   *  1. Stop propagation for any keydown originating inside a chip
   *     wrap. The chip strip owns its own keyboard semantics (roving
   *     + reorder + per-chip interactive children like the ✕ remove
   *     button). Without the stop, Enter / Space on the focused ✕
   *     bubbles to the trigger's `CngxListboxTrigger.handleKeyDown`,
   *     which opens the popover AND swallows the native Enter→click
   *     synthesis the `<button>` would have done — chip stays, popover
   *     opens. The trigger's combobox keyboard is meant for when
   *     focus sits on the trigger itself, not on a chip child.
   *
   *  2. Forward to the roving controller, which handles plain arrow /
   *     Home / End (modifier-pressed events are ignored so the paired
   *     `CngxReorder` owns that gesture).
   *
   * @internal
   */
  protected handleStripKeydown(event: KeyboardEvent): void {
    const target = event.target as Element | null;
    if (target?.closest('[data-reorder-index]')) {
      event.stopPropagation();
    }
    this.chipStripRoving.handleKeydown(event);
  }

  /** @internal */
  protected handleReorder(event: CngxReorderEvent<T>): void {
    if (this.reorderDisabled()) {
      return;
    }
    const { fromIndex, toIndex, next } = event;
    const previous = [...this.values()];
    if (fromIndex < 0 || fromIndex >= previous.length) {
      return;
    }
    const movedValue = previous[fromIndex];
    const opt = this.core.findOption(movedValue);
    this.reorderCommit.dispatch([...next], previous, fromIndex, toIndex, opt);

    // Keep focus on the moved chip in its new position. Runs after the
    // next render so the DOM reflects the updated @for ordering before
    // the roving controller probes for the [data-reorder-index=toIndex]
    // wrapper. `setActive` updates the index synchronously (bindings
    // reflect tabindex='0' on the right chip even before focus moves).
    this.chipStripRoving.setActive(toIndex);
    afterNextRender(
      () => this.chipStripRoving.focusAt(toIndex),
      { injector: this.injector },
    );
  }

  // ── Commit orchestration (toggle) ──────────────────────────────────

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

  // ── Commit orchestration (reorder) ─────────────────────────────────

  /**
   * Reorder-commit handler. Bypasses `createArrayCommitHandler.beginToggle`
   * — its `sameArrayContents` guard would skip the write because reorder
   * preserves membership — and drives the commit controller directly.
   * Instantiated via `CNGX_REORDER_COMMIT_HANDLER_FACTORY` so enterprise
   * consumers can swap in retry-with-backoff, offline queues, or audit
   * logging without forking the component.
   */
  private readonly reorderCommit = inject(CNGX_REORDER_COMMIT_HANDLER_FACTORY)<T>({
    values: this.values,
    commitMode: this.commitMode,
    commitAction: this.commitAction,
    commitController: this.core.commitController,
    getLastCommitted: () => this.lastCommittedValues,
    setLastCommitted: (v) => {
      this.lastCommittedValues = [...v];
    },
    onReorder: (values, previous, option, fromIndex, toIndex) => {
      const change: CngxReorderableMultiSelectChange<T> = {
        source: this,
        values,
        previousValues: previous,
        added: [],
        removed: [],
        option,
        action: 'reorder',
        fromIndex,
        toIndex,
      };
      this.selectionChange.emit(change);
      this.reordered.emit(change);
    },
    onAnnounce: (option, fromIndex, toIndex, count) => {
      this.core.announce(option, 'reordered', count, true, fromIndex, toIndex);
    },
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
  });
}
