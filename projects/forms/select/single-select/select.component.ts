import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
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

import { CngxClickOutside, CngxListbox, CngxListboxTrigger } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger, type PopoverPlacement } from '@cngx/common/popover';

import { CngxSelectPanel } from '../shared/internal/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CNGX_ACTION_HOST_BRIDGE_FACTORY } from '../shared/action-host-bridge';
import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import { createTypeaheadController } from '../shared/typeahead-controller';
import { CNGX_FLAT_NAV_STRATEGY } from '../shared/flat-nav-strategy';

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
  type CngxSelectSelectionIndicatorVariant,
} from '../shared/config';
import { type CngxSelectOptionDef, type CngxSelectOptionsInput } from '../shared/option.model';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { setupVirtualization } from '../shared/internal/setup-virtualization';
import {
  CNGX_SCALAR_COMMIT_HANDLER_FACTORY,
  type ScalarCommitHandler,
} from '../shared/scalar-commit-handler';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import { resolveTemplate } from '../shared/internal/resolve-template';
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
} from '../shared/internal/select-core';
import {
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectRetryButton,
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  CngxSelectTriggerLabel,
  type CngxSelectTriggerLabelContext,
} from '../shared/template-slots';

/**
 * Change event emitted by {@link CngxSelect.selectionChange} on user picks.
 *
 * @category forms/select/single-select
 */
export interface CngxSelectChange<T = unknown> {
  readonly source: CngxSelect<T>;
  readonly value: T | undefined;
  /**
   * Value before the change committed. Populated on every commit-flow
   * emission (success + error) and on direct activation / clear paths;
   * `undefined` only when the previous state was empty.
   */
  readonly previousValue: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Native-feeling single-select dropdown. Behaves like `<select>`,
 * exceeds `mat-select` on a11y. Stateless signal graph (ARIA, panel
 * view, option model, commit-controller surface) lives in
 * {@link createSelectCore}.
 *
 * @category forms/select/single-select
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/single-select/select.component.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxCombobox, CngxTypeahead, CngxTreeSelect, CngxSelectShell
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * @playground Commit action ./examples/commit-action/commit-action-example.component.ts
 * <example-url>http://localhost:4200/#/forms/select/single-select/autofocus-on-mount</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/clearable</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/fixed-width-panel-number</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/keyboard-pageup-pagedown-on-a-long-list</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/loading-empty-templates</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/optgroups</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/reactive-forms-adaptformcontrol</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/rich-option-rendering</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/selection-indicator-variant-radio</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/signal-forms-required</example-url>
 * <example-url>http://localhost:4200/#/forms/select/single-select/standalone</example-url>

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
    class: 'cngx-select',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  templateUrl: './select.component.html',
  styleUrls: ['../shared/select-base.css', './select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly config = resolveSelectConfig();

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
   * wins over `CngxSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<CngxSelectSelectionIndicatorVariant | null>(null);
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /**
   * Replaces the built-in `✕` glyph inside the default clear button
   * while keeping the button frame, ARIA, and click handler. Ignored
   * when `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the built-in `▾` caret glyph. Ignored when
   * `*cngxSelectCaret` is projected.
   */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Clear selection',
  );
  readonly loading = input<boolean>(false);
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);
  readonly retryFn = input<(() => void) | null>(null);
  readonly commitAction = input<CngxSelectCommitAction<T> | null>(null);
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(this.config.commitErrorDisplay);
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);
  /**
   * Scalar-commit error-announce policy. `'verbose'` reads the error
   * message; `'soft'` reads "selection removed". Per-instance input wins
   * over `CngxSelectConfig.commitErrorAnnouncePolicy`; default
   * `{ kind: 'verbose', severity: 'assertive' }`.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );
  readonly value = model<T | undefined>(undefined);

  readonly selectionChange = output<CngxSelectChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly optionSelected = output<CngxSelectOptionDef<T> | null>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly triggerLabelDirective =
    contentChild<CngxSelectTriggerLabel<T>>(CngxSelectTriggerLabel);
  private readonly optionLabelDirective =
    contentChild<CngxSelectOptionLabel<T>>(CngxSelectOptionLabel);
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDirective =
    contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
  private readonly refreshingDirective = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDirective =
    contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly clearButtonDirective =
    contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly optionPendingDirective =
    contentChild<CngxSelectOptionPending<T>>(CngxSelectOptionPending);
  private readonly optionErrorDirective =
    contentChild<CngxSelectOptionError<T>>(CngxSelectOptionError);

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
  });
  /**
   * Variant-specific trigger label override. Inline because
   * `CngxSelectTriggerLabel`'s `CngxSelectOptionDef<T>` context is
   * replaced with array-shaped contexts in multi/combobox.
   *
   * @internal
   */
  protected readonly triggerLabelTpl = resolveTemplate(this.triggerLabelDirective, 'triggerLabel');

  /**
   * Context bound to the `*cngxSelectTriggerLabel` outlet. Selected
   * option plus live `disabled` / `panelOpen` / `focused` flags so
   * consumer templates render state-aware content without re-subscribing.
   *
   * @internal
   */
  protected readonly triggerLabelContext = computed<CngxSelectTriggerLabelContext<T>>(
    () => ({
      $implicit: this.selectedOption(),
      selected: this.selectedOption(),
      disabled: this.disabled(),
      panelOpen: this.panelOpen(),
      focused: this.focused(),
    }),
    {
      equal: (a, b) =>
        a.$implicit === b.$implicit &&
        a.selected === b.selected &&
        a.disabled === b.disabled &&
        a.panelOpen === b.panelOpen &&
        a.focused === b.focused,
    },
  );

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** @internal */
  readonly activeId = computed<string | null>(() => this.listboxRef()?.ad.activeId() ?? null);

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal */ readonly focused = this.focusState.focused;

  readonly empty = computed<boolean>(() => this.isEmpty());

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  /**
   * Append-only buffer for inline-created items. Merged into
   * `effectiveOptions` so patched options survive server refetches.
   *
   * @internal
   */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(this.compareWith);

  /**
   * Action-slot bridge: `actionDirty`, the panel-shell callback bundle,
   * config-driven focus-trap policy. Surfaced to the shell via the
   * `CngxSelectPanelViewHost` slots below; consumed by the dismiss-handler.
   *
   * @internal
   */
  private readonly actionBridge = inject(CNGX_ACTION_HOST_BRIDGE_FACTORY)({
    close: () => this.close(),
  });
  /** @internal */ readonly actionDirty = this.actionBridge.dirty;
  /** @internal */ readonly actionCallbacks = this.actionBridge.callbacks;
  /** @internal */ readonly actionFocusTrapEnabled = this.actionBridge.shouldTrapFocus;

  /**
   * Family-shared signal graph. Owns every derivation identical across
   * `CngxMultiSelect` / `CngxCombobox`.
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
   * Append a pre-built option to the local buffer. Renders in the next
   * panel emission and silently drops once the server includes a
   * matching value. Idempotent under `compareWith`.
   */
  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }

  /**
   * Reset the local buffer. Idempotent.
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
  /** @internal */ readonly ariaLabels = this.core.ariaLabels;

  /** @internal - full virtualisation wire-up (see setupVirtualization). */
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
   * Keyboard typeahead engine. Family-shared via
   * `shared/typeahead-controller`. Printable-key matching, multi-char
   * buffer, debounce-reset, disabled-skip.
   */
  private readonly typeaheadController = createTypeaheadController<T>({
    options: this.flatOptions,
    compareWith: this.compareWith,
    debounceMs: this.typeaheadDebounceInterval,
    disabled: this.disabled,
  });

  /**
   * Flat-nav policy via `CNGX_FLAT_NAV_STRATEGY`. Drives PageUp/Down
   * and typeahead-while-closed; variant only dispatches the action.
   */
  private readonly flatNavStrategy = inject(CNGX_FLAT_NAV_STRATEGY);

  /** Read-only view of the commit lifecycle. */
  readonly commitState = this.core.commitState;
  /** `true` while a commit is in flight. */
  readonly isCommitting = this.core.isCommitting;
  /** @internal - latest commit error. */
  readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  protected readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());
  /** @internal */
  protected readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

  /**
   * Currently selected option, resolved against `options`. Structural
   * equal on `.value` under `compareWith` - fresh OptionDef references
   * for the same value don't cascade downstream re-renders (server
   * refetch pattern).
   */
  readonly selected = computed<CngxSelectOptionDef<T> | null>(() => this.selectedOption(), {
    equal: (a, b) => {
      if (a === b) {
        return true;
      }
      if (a === null || b === null) {
        return false;
      }
      return (this.compareWith() as CngxSelectCompareFn<unknown>)(a.value, b.value);
    },
  });

  /** Human-readable label displayed on the trigger. */
  readonly triggerValue = computed<string>(() => this.triggerText());

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
   * Scalar commit handler. Variant wrinkles ride the callbacks:
   *
   *   - `onStateChange('pending')` → eager-close popover in optimistic mode.
   *   - `onCommitFinalize` → emit selectionChange + optionSelected,
   *     announce 'added', close popover in pessimistic mode.
   *   - `onCommitError` → delegate to commit-error-announcer.
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
      // Pessimistic: close popover on success (was held open while
      // pending). AD dispatcher already closed the non-commit path;
      // hide() is idempotent.
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
      // Optimistic: close popover eagerly so user sees instant close,
      // rollback on error.
      if (status === 'pending' && this.commitMode() === 'optimistic') {
        const pop = this.popoverRef();
        if (pop?.isVisible()) {
          pop.hide();
        }
      }
    },
    onError: (err) => this.commitError.emit(err),
  });

  /** @internal */ protected readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */ protected readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */ protected readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */ protected readonly isCommittingOption =
    this.core.panelHostAdapter.isCommittingOption;

  protected isEmpty(): boolean {
    const v = this.value();
    return v === undefined || v === null;
  }

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Lifecycle + routing in createADActivationDispatcher; value-shape work
    // stays inline.
    createADActivationDispatcher<T, T>({
      listboxRef: this.listboxRef,
      core: this.core,
      popoverRef: this.popoverRef,
      closeOnSelect: true,
      commitAction: this.commitAction,
      onCommit: (intended, opt) => this.scalarHandler.dispatchFromActivation(intended, opt),
      onActivate: (intended, opt) => {
        // Snapshot previous before the listbox's activation subscriber
        // writes through [(value)]. RxJS Subject fires subscribers in
        // registration order; the listbox (subscribed in its own
        // constructor) runs first, so `untracked(value)` may already
        // be the new value. When snapshot === intended, consumers see
        // `previousValue === value` - honest "no change detected".
        const previous = untracked(() => this.value());
        this.scalarHandler.finalizeSelection(intended, opt, previous);
      },
    });

    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.triggerBtn,
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
  }

  open(): void {
    this.popoverRef()?.show();
  }
  close(): void {
    this.popoverRef()?.hide();
  }
  toggle(): void {
    this.popoverRef()?.toggle();
  }
  focus(options?: FocusOptions): void {
    this.triggerBtn()?.nativeElement.focus(options);
  }

  /** @internal */
  protected handleTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggle();
  }

  /** @internal - click-outside dismissal (action-dirty-guarded). */
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
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
    this.clearCallback();
  }

  /** @internal - imperative clear path. Stable reference for ngTemplateOutlet. */
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
    const lb = this.listboxRef();
    const pop = this.popoverRef();

    // Typeahead-while-closed - native <select> parity. Round-robin
    // from the current selection so repeat-taps advance through matches.
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        const eq = this.compareWith();
        const flat = this.flatOptions();
        const v = this.value();
        const currentFlatIndex =
          v === undefined || v === null ? -1 : flat.findIndex((o) => eq(o.value, v));
        const action = this.flatNavStrategy.onTypeaheadWhileClosed(
          {
            options: flat,
            listboxItems: lb?.options() ?? [],
            currentFlatIndex,
            currentListboxIndex: -1,
            compareWith: eq,
            disabled: this.disabled(),
            typeaheadController: this.typeaheadController,
          },
          key,
        );
        if (action.kind === 'select') {
          event.preventDefault();
          const previous = v;
          this.value.set(action.option.value);
          this.selectionChange.emit({
            source: this,
            value: action.option.value,
            previousValue: previous,
            option: action.option,
          });
          this.optionSelected.emit(action.option);
          this.core.announce(action.option, 'added', 1, false);
          return;
        }
      }
    }

    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      if (!pop || !lb) {
        return;
      }
      if (!pop.isVisible()) {
        pop.show();
      }
      const items = lb.options();
      const ad = lb.ad;
      const currentId = ad.activeId();
      const currentListboxIndex = items.findIndex((o) => o.id === currentId);
      const direction: 1 | -1 = event.key === 'PageDown' ? 1 : -1;
      const action = this.flatNavStrategy.onPageJump(
        {
          options: this.flatOptions(),
          listboxItems: items,
          currentFlatIndex: -1,
          currentListboxIndex,
          compareWith: this.compareWith(),
          disabled: this.disabled(),
          typeaheadController: this.typeaheadController,
        },
        direction,
      );
      if (action.kind === 'highlight') {
        ad.highlightByIndex(action.index);
      }
    }
  }
}
