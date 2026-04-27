import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  model,
  output,
  untracked,
  type ElementRef,
  type Signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';

import { CNGX_STATEFUL, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import type { ActiveDescendantItem } from '@cngx/common/a11y';
import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
  CNGX_OPTION_CONTAINER,
  CNGX_OPTION_STATUS_HOST,
  type CngxOption,
  type CngxOptionGroup,
  type CngxOptionStatus,
  type CngxOptionStatusHost,
} from '@cngx/common/interactive';
import {
  CngxPopover,
  CngxPopoverTrigger,
  type PopoverPlacement,
} from '@cngx/common/popover';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { createADActivationDispatcher } from '../shared/ad-activation-dispatcher';
import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import {
  type CngxSelectCommitAction,
  type CngxSelectCommitErrorDisplay,
  type CngxSelectCommitMode,
} from '../shared/commit-action.types';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '../shared/local-items-buffer';
import {
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { CNGX_SELECT_PANEL_HOST } from '../shared/panel-host';
import { resolveSelectConfig } from '../shared/resolve-config';
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
import {
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectLoadingGlyph,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  CngxSelectRetryButton,
  CngxSelectTriggerLabel,
  type CngxSelectTriggerLabelContext,
} from '../shared/template-slots';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';

/**
 * Change event emitted by {@link CngxSelectShell.selectionChange} on a
 * user-driven pick.
 *
 * @category interactive
 */
export interface CngxSelectShellChange<T = unknown> {
  readonly source: CngxSelectShell<T>;
  readonly value: T | undefined;
  readonly previousValue?: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Native-feeling single-value dropdown with **declarative options** —
 * consumers project user `<cngx-option>` / `<cngx-optgroup>` children and
 * the shell derives a hierarchy-aware option model behind the scenes.
 *
 * Bridges the "compose yourself" path (raw `cngxListbox`) and the data
 * path (`<cngx-select [options]="...">`) by giving the same family-level
 * intelligence — reactive trigger ARIA via {@link createSelectCore},
 * panel composition with `cngxListbox` + popover, and the full template-
 * slot cascade — to a content-projected option list.
 *
 * Naming note: distinct from the internal `CngxSelectPanelShell` —
 * `Shell` here means *projection-shell*, the outer scaffold that wraps
 * user-authored option markup.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-select-shell',
  exportAs: 'cngxSelectShell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxPopover,
    CngxPopoverTrigger,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelectShell },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxSelectShell);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxSelectShell },
    { provide: CNGX_OPTION_STATUS_HOST, useExisting: CngxSelectShell },
  ],
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-select-shell__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      @let aria = triggerAria();
      <div
        #triggerBtn
        class="cngx-select-shell__trigger"
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
      >
        <span class="cngx-select-shell__label">{{ triggerText() }}</span>
        @if (clearable() && !empty() && !disabled()) {
          <button
            type="button"
            class="cngx-select-shell__clear"
            [attr.aria-label]="clearButtonAriaLabel()"
            (click)="handleClearClick($event)"
          >
            @if (clearGlyph(); as glyph) {
              <ng-container *ngTemplateOutlet="glyph" />
            } @else {
              <span aria-hidden="true">&#10005;</span>
            }
          </button>
        }
        @if (resolvedShowCaret()) {
          @if (caretGlyph(); as glyph) {
            <span aria-hidden="true" class="cngx-select-shell__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-select-shell__caret">&#9662;</span>
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
          [explicitOptions]="projectedOptions()"
          [items]="adItems()"
          [(value)]="value"
        >
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './select-shell.component.css'],
})
export class CngxSelectShell<T = unknown>
  implements CngxFormFieldControl, CngxOptionStatusHost
{
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly config = resolveSelectConfig();

  // ── Inputs ─────────────────────────────────────────────────────────

  readonly labelInput = input<string>('', { alias: 'label' });
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
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);
  readonly selectionIndicatorPosition = input<'before' | 'after' | null>(null);
  readonly selectionIndicatorVariant = input<'auto' | 'checkbox' | 'checkmark' | null>(
    null,
  );
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Clear selection',
  );
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  readonly loading = input<boolean>(false);
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(
    this.config.refreshingVariant,
  );
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
   * Scalar-commit error-announce policy. Per-instance input wins over
   * {@link CngxSelectConfig.commitErrorAnnouncePolicy}; when neither is
   * set, the variant default `{ kind: 'verbose', severity: 'assertive' }`
   * applies. Mirrors the {@link CngxSelect} input contract.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );

  /** Two-way bindable selected value. */
  readonly value = model<T | undefined>(undefined);

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxSelectShellChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();

  // ── Hierarchy-aware projected option model ────────────────────────

  /**
   * Direct top-level entries projected by the consumer — `<cngx-option>`
   * leaves and `<cngx-optgroup>` parents in DOM order.
   *
   * @internal
   */
  private readonly containers = contentChildren(CNGX_OPTION_CONTAINER, {
    descendants: false,
  });

  /**
   * Hierarchy-preserving option model derived from the projected DOM.
   * Leaves stay leaves, groups stay groups — `createSelectCore`
   * reflattens for AD lookup and reuses the structure for the (deferred)
   * panel-shell renderer.
   *
   * Plain-text labels (Part A Phase 3) — `option.label()` is the shared
   * `Signal<string>` projection; closed-trigger rendering reads it via
   * `{{ ... }}` text interpolation only, never `[innerHTML]`.
   *
   * @internal
   */
  protected readonly derivedOptions = computed<CngxSelectOptionsInput<T>>(
    () => {
      const items: (CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>)[] = [];
      for (const c of this.containers()) {
        if (c.kind === 'option') {
          // CNGX_OPTION_CONTAINER is provided via `useExisting: CngxOption` —
          // the runtime instance carries the full directive surface even
          // though the structural token type is intentionally narrow.
          const opt = c as unknown as CngxOption;
          items.push({
            value: opt.value() as T,
            label: opt.label(),
            disabled: opt.disabled(),
          });
        } else {
          const grp = c as unknown as CngxOptionGroup;
          const children: CngxSelectOptionDef<T>[] = [];
          for (const o of grp.options()) {
            children.push({
              value: o.value() as T,
              label: o.label(),
              disabled: o.disabled(),
            });
          }
          items.push({ label: grp.label(), children });
        }
      }
      return items;
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
          const x = a[i];
          const y = b[i];
          if (x === y) {
            continue;
          }
          const xg = x as CngxSelectOptionGroupDef<T>;
          const yg = y as CngxSelectOptionGroupDef<T>;
          if (xg.children !== undefined || yg.children !== undefined) {
            if (xg.label !== yg.label) {
              return false;
            }
            const xc = xg.children ?? [];
            const yc = yg.children ?? [];
            if (xc.length !== yc.length) {
              return false;
            }
            for (let j = 0; j < xc.length; j++) {
              const xj = xc[j];
              const yj = yc[j];
              if (
                xj.value !== yj.value ||
                xj.label !== yj.label ||
                (xj.disabled ?? false) !== (yj.disabled ?? false)
              ) {
                return false;
              }
            }
          } else {
            const xo = x as CngxSelectOptionDef<T>;
            const yo = y as CngxSelectOptionDef<T>;
            if (
              xo.value !== yo.value ||
              xo.label !== yo.label ||
              (xo.disabled ?? false) !== (yo.disabled ?? false)
            ) {
              return false;
            }
          }
        }
        return true;
      },
    },
  );

  /**
   * Flat list of `CngxOption` directive instances, walking the projected
   * tree. Fed to `cngxListbox [explicitOptions]` so the listbox bypasses
   * its own content-projection-scoped query (the very gap this shell was
   * built to close — see plan Context).
   *
   * @internal
   */
  protected readonly projectedOptions = computed<readonly CngxOption[]>(
    () => {
      const out: CngxOption[] = [];
      for (const c of this.containers()) {
        if (c.kind === 'option') {
          out.push(c as unknown as CngxOption);
        } else {
          const grp = c as unknown as CngxOptionGroup;
          for (const o of grp.options()) {
            out.push(o);
          }
        }
      }
      return out;
    },
    {
      equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
    },
  );

  /**
   * `ActiveDescendantItem[]` projection forwarded to the listbox's AD
   * via the host-directive `[items]` input. Bypasses the AD's own
   * `contentChildren(CNGX_AD_ITEM)` query (which loses content-projected
   * items to authoring-view scoping) — same fix shape as
   * `[explicitOptions]` above but for the AD layer.
   *
   * @internal
   */
  protected readonly adItems = computed<ActiveDescendantItem[]>(() => {
    const opts = this.projectedOptions();
    const items: ActiveDescendantItem[] = [];
    for (const opt of opts) {
      items.push({
        id: opt.id,
        value: opt.value(),
        label: opt.label(),
        disabled: opt.disabled(),
      });
    }
    return items;
  });

  // ── Content-child template-slot directives ─────────────────────────

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective =
    contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly loadingGlyphDirective =
    contentChild<CngxSelectLoadingGlyph>(CngxSelectLoadingGlyph);
  private readonly triggerLabelDirective = contentChild<CngxSelectTriggerLabel<T>>(
    CngxSelectTriggerLabel,
  );
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(
    CngxSelectOptionLabel,
  );
  private readonly errorDirective = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDirective =
    contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
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

  /** @internal */
  readonly tpl = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    check: this.checkDirective,
    caret: this.caretDirective,
    optgroup: this.optgroupDirective,
    placeholder: this.placeholderDirective,
    empty: this.emptyDirective,
    loading: this.loadingDirective,
    loadingGlyph: this.loadingGlyphDirective,
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
   * Variant-specific trigger-label slot. The shared registry omits this
   * because the directive's typed context shape varies per variant.
   *
   * @internal
   */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxSelectTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDirective()?.templateRef ?? null);

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

  // ── CngxFormFieldControl ───────────────────────────────────────────

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal */ readonly focused = this.focusState.focused;

  readonly empty = computed<boolean>(() => {
    const v = this.value();
    return v === undefined || v === null;
  });

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // ── Local-items buffer (kept for panel-host parity; unused at the
  //    shell level — the projected DOM is the source of truth). ──────

  /** @internal */
  private readonly localItemsBuffer = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<T>(
    this.compareWith,
  );

  // ── Core (stateless signal graph) ──────────────────────────────────

  /**
   * Family-shared signal graph — ARIA projection, panel view,
   * commit-controller surface, announcer. `commitAction` is wired
   * here so {@link externalActivation} flips automatically when the
   * consumer binds an action; the actual scalar-handler routing
   * lands in Phase 7.
   *
   * @internal
   */
  private readonly core = createSelectCore<T, T>(
    {
      label: this.labelInput,
      ariaLabel: this.ariaLabel,
      ariaLabelledBy: this.ariaLabelledBy,
      placeholder: this.placeholder,
      idInput: this.idInput,
      disabledInput: this.disabledInput,
      requiredInput: this.requiredInput,
      tabIndex: this.tabIndex,
      options: this.derivedOptions,
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

  // ── Template-facing protected surface (delegates to core) ──────────

  /** @internal */ readonly effectiveOptions = this.core.effectiveOptions;
  /** @internal */ readonly flatOptions = this.core.flatOptions;
  /** @internal */ readonly activeView = this.core.activeView;
  /** @internal */ readonly showRefreshIndicator = this.core.showRefreshIndicator;
  /** @internal */ readonly showInlineError = this.core.showInlineError;
  /** @internal */ readonly skeletonIndices = this.core.skeletonIndices;
  /** @internal */ readonly panelClassList = this.core.panelClassList;
  /** @internal */ readonly panelWidthCss = this.core.panelWidthCss;
  /** @internal */ readonly fallbackLabels = this.core.fallbackLabels;
  /** @internal */ readonly ariaLabels = this.core.ariaLabels;
  /** @internal */ readonly resolvedId = this.core.resolvedId;
  /** @internal */ readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  /** @internal */ readonly resolvedShowSelectionIndicator =
    this.core.resolvedShowSelectionIndicator;
  /** @internal */ readonly resolvedSelectionIndicatorVariant =
    this.core.resolvedSelectionIndicatorVariant;
  /** @internal */ readonly resolvedSelectionIndicatorPosition =
    this.core.resolvedSelectionIndicatorPosition;
  /** @internal */ protected readonly resolvedShowCaret = this.core.resolvedShowCaret;
  /** @internal */ protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ readonly ariaReadonly = this.core.ariaReadonly;
  /** @internal */ protected readonly effectiveTabIndex = this.core.effectiveTabIndex;
  /** @internal */ readonly externalActivation = this.core.externalActivation;
  /** @internal */ readonly showCommitError = this.core.showCommitError;

  readonly disabled = this.core.disabled;
  readonly id = computed<string>(() => this.core.resolvedId() ?? '');

  readonly commitState = this.core.commitState;
  readonly isCommitting = this.core.isCommitting;
  /** @internal */ readonly commitErrorValue = this.core.commitErrorValue;

  /** @internal */
  readonly errorContext = this.core.makeErrorContext(() => this.handleRetry());

  // ── Commit state (delegated) ───────────────────────────────────────

  /**
   * Routes a failed commit through the family-shared announcer policy
   * (verbose / soft, assertive / polite). Keeps the variant body free
   * of error-message formatting and live-region routing.
   *
   * @internal
   */
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
   * Shared scalar commit handler — same factory `CngxSelect` consumes.
   * `onStateChange('pending')` eager-closes the popover in optimistic
   * mode; `onCommitFinalize` emits selectionChange + announces 'added';
   * `onCommitError` delegates to the announcer; `onError` emits the
   * variant's `commitError` output.
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
      this.core.announce(option, 'added', option ? 1 : 0, false);
      // Pessimistic mode kept the popover open while pending; close it
      // on success now that the write committed. AD dispatcher already
      // handled the optimistic / non-commit close — calling hide()
      // again is a no-op there.
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
  readonly commitErrorContext = this.core.bindCommitRetry(() =>
    this.scalarHandler.retryLast(),
  );

  /** Currently selected option resolved against the derived option model. */
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
      return map.get(v) ?? null;
    }
    const eq = this.compareWith();
    return this.flatOptions().find((o) => eq(o.value, v)) ?? null;
  });

  /** @internal */
  protected readonly triggerText = computed<string>(() => {
    const fallback = this.placeholder() || this.labelInput();
    return this.selectedOption()?.label ?? fallback;
  });

  // ── Panel-host adapter delegation ──────────────────────────────────

  /** @internal */ readonly isGroup = this.core.panelHostAdapter.isGroup;
  /** @internal */ readonly isSelected = this.core.panelHostAdapter.isSelected;
  /** @internal */ readonly isIndeterminate = this.core.panelHostAdapter.isIndeterminate;
  /** @internal */ readonly isCommittingOption =
    this.core.panelHostAdapter.isCommittingOption;

  // ── Panel-host interface completeness ──────────────────────────────
  //
  // Phase 5 satisfies the full {@link CngxSelectPanelHost} contract so
  // CNGX_SELECT_PANEL_HOST resolves correctly; the panel-shell overlay
  // itself is deferred to Phase 10 (locked decision in plan), so these
  // fields exist for the contract but nothing in the current template
  // renders against them.

  /** @internal */ readonly unfilteredCount = computed(
    () => this.core.unfilteredFlatOptions().length,
  );
  /** @internal */ readonly previousLoadedCount = computed(
    () => this.flatOptions().length,
  );

  patchData(item: CngxSelectOptionDef<T>): void {
    this.localItemsBuffer.patch(item);
  }
  clearLocalItems(): void {
    this.localItemsBuffer.clear();
  }

  // ── CngxOptionStatusHost — drives per-option commit pending/error ──
  //
  // Routes commit-pending and commit-error glyphs into each
  // `CngxOption`'s reserved internal status slot (Phase 2 contract),
  // never alongside user content. The option directive injects
  // `CNGX_OPTION_STATUS_HOST` and renders the resolved `tpl` inside its
  // own `.cngx-option__status` span.

  /** @internal */
  statusFor<TVal>(value: TVal): Signal<CngxOptionStatus | null> {
    return computed<CngxOptionStatus | null>(() => {
      const opt = this.core.togglingOption();
      if (!opt) {
        return null;
      }
      const eq = this.compareWith() as CngxSelectCompareFn<unknown>;
      if (!eq(opt.value, value)) {
        return null;
      }
      const err = this.core.commitErrorValue();
      if (err !== undefined && err !== null) {
        return {
          kind: 'error',
          tpl: this.tpl.optionError() as TemplateRef<unknown> | null,
        };
      }
      if (this.isCommitting()) {
        return {
          kind: 'pending',
          tpl: this.tpl.optionPending() as TemplateRef<unknown> | null,
        };
      }
      return null;
    });
  }

  constructor() {
    // Honor [autofocus] on first render.
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Bridge AD activations into popover-close, selectionChange output,
    // and (when [commitAction] is bound) the commit flow. Lifecycle and
    // routing live in `createADActivationDispatcher`; value-shape work
    // (previous-value snapshot, finalize emission) stays here. Pattern
    // mirrors `CngxSelect` verbatim.
    createADActivationDispatcher<T, T>({
      listboxRef: this.listboxRef,
      core: this.core,
      popoverRef: this.popoverRef,
      closeOnSelect: true,
      commitAction: this.commitAction,
      onCommit: (intended, opt) =>
        this.scalarHandler.dispatchFromActivation(intended, opt),
      onActivate: (intended, opt) => {
        // Snapshot previous value before the listbox's own activation
        // subscriber writes the new value through [(value)]. RxJS
        // Subject subscribers fire in registration order; the listbox
        // (subscribed during its own constructor) runs before this
        // callback. Reading `untracked(value)` returns whatever has
        // already propagated.
        const previous = untracked(() => this.value());
        this.scalarHandler.finalizeSelection(intended, opt, previous);
      },
    });

    // Panel open/close lifecycle events. Restores focus to the trigger
    // on close (queued via microtask inside the emitter so popover-close
    // DOM mutation settles first).
    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.triggerBtn,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
    });

    // Bidirectional sync with the bound form field (if any). Reads
    // CngxFormFieldPresenter via the family-shared factory; the two
    // installed effects each guard with `valueEquals` so a write in
    // either direction does not bounce back. Standalone use (no field
    // bound) is a no-op — the factory returns early when no presenter
    // is in scope.
    createFieldSync<T | undefined>({
      componentValue: this.value,
      valueEquals: (a, b) =>
        (this.compareWith() as CngxSelectCompareFn<unknown>)(a, b),
      coerceFromField: (x) => x as T | undefined,
    });
  }

  // ── Public API (mat-select parity) ─────────────────────────────────

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

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal */
  protected handleTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggle();
  }

  /** @internal — click-outside dismissal. */
  protected readonly handleClickOutside = inject(CNGX_DISMISS_HANDLER_FACTORY)({
    popoverRef: this.popoverRef,
    dismissOn: this.config.dismissOn,
  }).handleClickOutside;

  /** @internal */
  handleRetry(): void {
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** @internal */
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
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
    this.core.announce(null, 'removed', 0, false);
  }

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
}

