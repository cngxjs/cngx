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
  type TemplateRef,
} from '@angular/core';

import { CNGX_STATEFUL, type CngxAsyncState, type AsyncStatus } from '@cngx/core/utils';

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

import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import {
  createTypeaheadController,
  resolvePageJumpTarget,
} from '../shared/typeahead-controller';

import { CngxSelectAnnouncer } from '../shared/announcer';
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
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { resolveTemplate } from '../shared/resolve-template';
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
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  CngxSelectTriggerLabel,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxSelect.selectionChange} when the
 * user (not programmatic writes) picks a value.
 *
 * @category interactive
 */
export interface CngxSelectChange<T = unknown> {
  readonly source: CngxSelect<T>;
  readonly value: T | undefined;
  /**
   * Value before the change was committed. `undefined` both when the
   * previous state was empty and (for back-compat) on the narrow paths
   * where no snapshot was captured. Consumers implementing
   * undo/redo, audit logging, or commit-error recovery UIs can rely on
   * this being populated for every emission from the commit-flow
   * (success + error paths) and from the direct activation / clear
   * paths.
   */
  readonly previousValue?: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Native-feeling single-select dropdown. Behaves like `<select>`, exceeds
 * `mat-select` on a11y, uses the shared {@link createSelectCore} factory
 * for the stateless signal graph (ARIA projection, panel view, option
 * model, commit-controller surface).
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-select',
  exportAs: 'cngxSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxSelect },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxSelect },
  ],
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
    <!--
      role="combobox" with a focusable <div> — NOT a <button>. The
      trigger hosts an interactive child (clearable ✕ or a
      consumer-authored *cngxSelectClearButton template) which would
      be an invalid nested button inside a <button>. WAI-ARIA 1.2
      combobox pattern.
    -->
    @let aria = triggerAria();
    <div
      #triggerBtn
      class="cngx-select__trigger"
      role="combobox"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'listbox'"
      [cngxListboxTrigger]="lb"
      [popover]="pop"
      [closeOnSelect]="true"
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
      <span class="cngx-select__label">
        @if (triggerLabelTpl(); as triggerTpl) {
          @if (!isEmpty()) {
            <ng-container
              *ngTemplateOutlet="
                triggerTpl;
                context: { $implicit: selectedOption(), selected: selectedOption() }
              "
            />
          } @else if (tpl.placeholder(); as phTpl) {
            <ng-container
              *ngTemplateOutlet="
                phTpl;
                context: { $implicit: placeholder(), placeholder: placeholder() }
              "
            />
          } @else {
            {{ placeholder() || label() }}
          }
        } @else if (isEmpty()) {
          @if (tpl.placeholder(); as phTpl) {
            <ng-container
              *ngTemplateOutlet="
                phTpl;
                context: { $implicit: placeholder(), placeholder: placeholder() }
              "
            />
          } @else {
            {{ placeholder() || label() }}
          }
        } @else {
          {{ triggerText() }}
        }
      </span>
      @if (clearable() && !isEmpty() && !disabled()) {
        @if (tpl.clearButton(); as clearBtnTpl) {
          <span class="cngx-select__clear-slot" (click)="$event.stopPropagation()">
            <ng-container
              *ngTemplateOutlet="
                clearBtnTpl;
                context: {
                  $implicit: clearCallback,
                  clear: clearCallback,
                  disabled: disabled()
                }
              "
            />
          </span>
        } @else {
          <button
            type="button"
            class="cngx-select__clear"
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
          <ng-container
            *ngTemplateOutlet="caretT; context: { $implicit: panelOpen(), open: panelOpen() }"
          />
        } @else if (caretGlyph(); as glyph) {
          <span aria-hidden="true" class="cngx-select__caret">
            <ng-container *ngTemplateOutlet="glyph" />
          </span>
        } @else {
          <span aria-hidden="true" class="cngx-select__caret">&#9662;</span>
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
        [(value)]="value"
      >
        <cngx-select-panel #panelRef="cngxSelectPanel" />
      </div>
    </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './select.component.css'],
})
export class CngxSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly announcer = inject(CngxSelectAnnouncer);
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
   * wins over {@link CngxSelectConfig.popoverPlacement} (app-wide
   * default `'bottom'`).
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /**
   * Replaces the built-in `✕` glyph inside the default clear button
   * while keeping the button frame, ARIA wiring, and click handler
   * intact. When `*cngxSelectClearButton` is projected, the projected
   * template takes full precedence and this input is ignored.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in `▾` caret glyph. When `*cngxSelectCaret` is
   * projected, it takes full precedence and this input is ignored.
   */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Auswahl entfernen',
  );
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
   * Scalar-commit error-announce policy. Controls whether a failing
   * commit reads the verbatim error message (`'verbose'`) or a soft
   * "selection removed" sentence (`'soft'`). Per-instance input wins
   * over {@link CngxSelectConfig.commitErrorAnnouncePolicy}; when
   * neither is set, the variant's shipped default of
   * `{ kind: 'verbose', severity: 'assertive' }` applies.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );
  readonly value = model<T | undefined>(undefined);

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxSelectChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly optionSelected = output<CngxSelectOptionDef<T> | null>();
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
  private readonly triggerLabelDirective = contentChild<CngxSelectTriggerLabel<T>>(
    CngxSelectTriggerLabel,
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
  /**
   * Variant-specific trigger label override. Stays inline because
   * `CngxSelectTriggerLabel` has a `CngxSelectOptionDef<T>` context that
   * multi/combobox variants replace with array-shaped contexts.
   *
   * @internal
   */
  protected readonly triggerLabelTpl = resolveTemplate(
    this.triggerLabelDirective,
    'triggerLabel',
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

  /**
   * Shared append-only buffer for inline-created items. Consumed by
   * `createSelectCore.effectiveOptions` via `mergeLocalItems` so a
   * patched option stays visible across server refetches until the
   * backend catches up. Public mutation methods route through here.
   *
   * @internal
   */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(
    this.compareWith,
  );

  // ── Action-slot bridge (dirty-guard + focus-trap policy) ──────────

  /**
   * Shared action-slot bridge: owns `actionDirty`, the callbacks
   * bundle the panel shell feeds to `*cngxSelectAction`, and the
   * config-driven focus-trap policy. Exposed to the shell through
   * the `CngxSelectPanelViewHost` slots `actionDirty` /
   * `actionCallbacks` / `actionFocusTrapEnabled` below, and consumed
   * by the variant's own dismiss-handler guards.
   *
   * @internal
   */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
  });
  /** @internal */ readonly actionDirty = this.actionBridge.dirty;
  /** @internal */ readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */ readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;

  // ── Core (stateless signal graph) ──────────────────────────────────

  /**
   * Signal-graph factory shared with {@link CngxMultiSelect} and
   * {@link CngxCombobox}. Owns every derivation that's identical
   * across the family.
   *
   * @internal
   */
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
   * buffer. The new option renders in the next panel emission even if
   * the backing state hasn't refetched; once the server catches up and
   * includes a matching value, `mergeLocalItems` drops the local copy
   * silently. Idempotent — duplicate values under the current
   * `compareWith` are no-ops.
   *
   * @category interactive
   */
  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

  /**
   * Reset the local buffer to empty. Idempotent — no-op when the
   * buffer already held nothing.
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
   * Keyboard typeahead engine. Shared with the rest of the select family
   * via `@cngx/forms/select/shared/typeahead-controller`. Handles
   * printable-key matching, multi-char buffering, debounce-reset and
   * disabled-skip in one place.
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
  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

  /** Currently selected option, resolved against `options`. */
  /**
   * Currently selected option, resolved against `options`. Structurally
   * compared — two OptionDefs with the same `.value` under `compareWith`
   * are considered equal, so downstream `@let selected = selected()` or
   * `[selected]=selected()` bindings don't cascade re-renders when the
   * upstream options array is re-emitted with a fresh OptionDef
   * reference for the same value (common with server-driven options).
   */
  readonly selected = computed<CngxSelectOptionDef<T> | null>(
    () => this.selectedOption(),
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

  /** Human-readable label displayed on the trigger. */
  readonly triggerValue = computed<string>(() => this.triggerText());

  // ── Single-selection state ─────────────────────────────────────────

  /** @internal */
  protected readonly selectedOption = computed<CngxSelectOptionDef<T> | null>(() => {
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
  });

  /** @internal */
  protected readonly triggerText = computed<string>(() => {
    const fallback = this.placeholder() || this.label();
    return this.selectedOption()?.label ?? fallback;
  });

  // ── Commit state (delegated) ───────────────────────────────────────

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
   * Shared scalar commit handler. Owns the beginCommit/finalizeSelection/
   * retryLast triad that this component previously carried inline. The
   * per-variant wrinkles (popover close timing, selectionChange +
   * optionSelected emission, announcer hook) ride the options callbacks:
   *
   *   - `onStateChange('pending')` → eager-close popover in optimistic mode
   *   - `onCommitFinalize(opt, value, previous)` → emit selectionChange +
   *     optionSelected, announce 'added', and close popover in pessimistic
   *     mode (idempotent when the AD dispatcher already closed it)
   *   - `onCommitError` → delegate to scalar-commit-error-announcer
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
      });
      this.optionSelected.emit(option);
      this.core.announce(option, 'added', option ? 1 : 0, false);
      // Pessimistic commit → the popover stayed open while pending, so
      // close it now that the write has committed. The AD dispatcher's
      // `closeOnSelect: true` already handled the non-commit path, and
      // calling hide() again is a no-op, so this only fires
      // meaningfully on commit-success.
      if (this.commitMode() === 'pessimistic') {
        const pop = this.popoverRef();
        if (pop?.isVisible()) {
          pop.hide();
        }
      }
    },
    onCommitError: (err) => this.announceCommitError(err),
    onStateChange: (status) => {
      this.stateChange.emit(status);
      // Optimistic commit → close the popover eagerly (matches the
      // historical beginCommit behaviour prior to scalar-handler
      // extraction — user sees an instant close + rollback on error).
      if (status === 'pending' && this.commitMode() === 'optimistic') {
        const pop = this.popoverRef();
        if (pop?.isVisible()) {
          pop.hide();
        }
      }
    },
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
    const v = this.value();
    return v === undefined || v === null;
  }

  constructor() {
    // Honor [autofocus] on first render.
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Bridge AD activations into popover-close, selectionChange output,
    // and (when bound) the commit flow. Lifecycle + routing live in
    // `createADActivationDispatcher`; value-shape work stays here.
    createADActivationDispatcher<T, T>({
      listboxRef: this.listboxRef,
      core: this.core,
      popoverRef: this.popoverRef,
      closeOnSelect: true,
      commitAction: this.commitAction,
      onCommit: (intended, opt) =>
        this.scalarHandler.dispatchFromActivation(intended, opt),
      onActivate: (intended, opt) => {
        // Capture previous BEFORE the listbox's internal activation
        // subscriber mutates our value via the [(value)] binding.
        // We're running inside the dispatcher's untracked() block, and
        // RxJS Subject subscribers fire in registration order — the
        // listbox (subscribed during its own constructor) runs before
        // us, so by the time we're here the value MAY already be the
        // new one. Reading untracked(value) snapshots whatever has
        // propagated. If the snapshot equals intended, consumers see
        // `previousValue === value` — semantically "no change
        // detected" which is a valid honest report.
        const previous = untracked(() => this.value());
        this.scalarHandler.finalizeSelection(intended, opt, previous);
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
    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) =>
        (this.compareWith() as CngxSelectCompareFn<unknown>)(a, b),
      coerceFromField: (x) => x as T | undefined,
    });
  }

  // ── Public API (mat-select parity) ─────────────────────────────────

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
    // Action-slot dirty-guard: while the consumer's inline workflow is
    // unsaved, clicks outside do not dismiss the panel. The shell's
    // capture-phase Escape hook handles the keyboard parallel.
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
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
    this.clearCallback();
  }

  /** @internal — imperative clear path. Stable reference for ngTemplateOutlet. */
  protected readonly clearCallback: () => void = () => {
    const current = this.value();
    if (current === undefined || current === null) {
      return;
    }
    this.value.set(undefined);
    this.selectionChange.emit({
      source: this,
      value: undefined,
      previousValue: current,
      option: null,
    });
    this.optionSelected.emit(null);
    this.core.announce(null, 'removed', 0, false);
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
    // Typeahead-while-closed — native <select> parity via shared
    // typeahead controller.
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        const eq = this.compareWith();
        const flat = this.flatOptions();
        const v = this.value();
        const currentIdx =
          v === undefined || v === null
            ? -1
            : flat.findIndex((o) => eq(o.value, v));
        const candidate = this.typeaheadController.matchFromIndex(key, currentIdx);
        if (candidate) {
          event.preventDefault();
          const previous = v;
          this.value.set(candidate.value);
          this.selectionChange.emit({
            source: this,
            value: candidate.value,
            previousValue: previous,
            option: candidate,
          });
          this.optionSelected.emit(candidate);
          this.core.announce(candidate, 'added', 1, false);
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
}

