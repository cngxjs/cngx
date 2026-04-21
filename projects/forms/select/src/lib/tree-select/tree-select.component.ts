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
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import { CngxChip } from '@cngx/common/display';
import {
  CngxClickOutside,
  CNGX_TREE_CONTROLLER_FACTORY,
  type CngxTreeController,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  CNGX_STATEFUL,
  nextUid,
  type AsyncStatus,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';
import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';
import { type CngxTreeNode, type FlatTreeNode } from '@cngx/utils';

import {
  createArrayCommitHandler,
  type ArrayCommitHandler,
} from '../shared/array-commit-handler';
import {
  type CngxSelectCommitAction,
  type CngxSelectCommitErrorDisplay,
  type CngxSelectCommitMode,
} from '../shared/commit-action.types';
import { sameArrayContents } from '../shared/compare';
import {
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import { createFieldSync } from '../shared/field-sync';
import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from '../shared/panel-host';
import { CNGX_SELECT_COMMIT_CONTROLLER_FACTORY } from '../shared/commit-controller';
import { resolveSelectConfig } from '../shared/resolve-config';
import { injectResolvedTemplate } from '../shared/resolve-template';
import {
  CngxSelectCaret,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  type CngxSelectCaretContext,
  type CngxSelectClearButtonContext,
  type CngxSelectCommitErrorContext,
  type CngxSelectErrorContext,
  type CngxSelectPlaceholderContext,
} from '../shared/template-slots';
import { cngxSelectDefaultCompare, type CngxSelectCompareFn } from '../shared/select-core';
import { CngxTreeSelectNode } from './tree-select-node.directive';
import {
  CNGX_TREE_SELECT_PANEL_HOST,
  type CngxTreeSelectPanelHost,
} from './tree-select-panel-host';
import { CngxTreeSelectPanel } from './tree-select-panel.component';
import type {
  CngxTreeSelectAction,
  CngxTreeSelectNodeContext,
} from './tree-select.model';

/**
 * Change event emitted by `CngxTreeSelect.selectionChange`. Shape lines
 * up with `CngxMultiSelectChange` / `CngxComboboxChange` so tree + flat
 * consumers can share `(selectionChange)` handlers; the `option` field
 * carries the `FlatTreeNode<T>` that triggered the event (rather than
 * the `CngxSelectOptionDef` from the flat world). `'cascade-toggle'`
 * is the tree-only action, fired once per parent-toggle that propagated
 * to descendants.
 *
 * @category interactive
 */
export interface CngxTreeSelectChange<T = unknown> {
  readonly source: CngxTreeSelect<T>;
  readonly values: readonly T[];
  readonly previousValues?: readonly T[];
  readonly added: readonly T[];
  readonly removed: readonly T[];
  readonly node: FlatTreeNode<T> | null;
  readonly action: CngxTreeSelectAction;
}

/**
 * Tree-structured multi-select. Fifth member of the select family; shares
 * the popover + shell + commit-action + focus + announce plumbing with
 * `CngxSelect` / `CngxMultiSelect` / `CngxCombobox` / `CngxTypeahead`,
 * and adds a `CngxTreeController` + selection-with-cascade-children on
 * top. The visible body is a W3C APG treeview rendered by
 * `CngxTreeSelectPanel`; ArrowLeft/Right navigation is wired through
 * `CngxHierarchicalNav`, ArrowUp/Down + Home/End + typeahead through
 * `CngxActiveDescendant`.
 *
 * Selection semantics:
 * - **Default (`[cascadeChildren]="false"`)**: toggles operate on the
 *   single activated value; indeterminate parents are still reported
 *   through `SelectionController.isIndeterminate` because the
 *   controller was seeded with `childrenFn`.
 * - **Cascade (`[cascadeChildren]="true"`)**: a parent toggle selects or
 *   deselects every descendant atomically. A single `selectionChange`
 *   event with `action: 'cascade-toggle'` carries the aggregated
 *   `added` / `removed` lists.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-tree-select',
  exportAs: 'cngxTreeSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxChip,
    CngxClickOutside,
    CngxPopover,
    CngxPopoverTrigger,
    CngxTreeSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxTreeSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxTreeSelect);
        return { state: self.commitState };
      },
    },
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxTreeSelect },
    { provide: CNGX_TREE_SELECT_PANEL_HOST, useExisting: CngxTreeSelect },
  ],
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-tree-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
      <!--
        role="combobox" as <div> (not <button>) — trigger carries
        interactive chips + clear-button children, which would be
        invalid nested interactives inside a <button>. WAI-ARIA 1.2
        multi-value pattern, identical to CngxMultiSelect.
      -->
      @let aria = triggerAria();
      <div
        #triggerBtn
        class="cngx-tree-select__trigger"
        role="combobox"
        [cngxPopoverTrigger]="pop"
        [haspopup]="'listbox'"
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
              <span class="cngx-tree-select__placeholder">
                {{ placeholder() || label() }}
              </span>
            }
          } @else {
            @for (opt of selected(); track keyFnInternal()(opt.value)) {
              <cngx-chip
                [removable]="!disabled()"
                [removeAriaLabel]="chipRemoveAriaLabel() + ': ' + opt.label"
                (remove)="handleChipRemoveClick($event, opt)"
              >
                {{ opt.label }}
              </cngx-chip>
            }
          }
        </span>
        @if (clearable() && !isEmpty() && !disabled()) {
          @if (clearButtonTpl(); as tpl) {
            <span class="cngx-tree-select__clear-slot" (click)="$event.stopPropagation()">
              <ng-container
                *ngTemplateOutlet="
                  tpl;
                  context: {
                    $implicit: clearAll,
                    clear: clearAll,
                    disabled: disabled()
                  }
                "
              />
            </span>
          } @else {
            <button
              type="button"
              class="cngx-tree-select__clear-all"
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
        @if (!hideCaret()) {
          @if (caretTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl; context: { $implicit: panelOpen(), open: panelOpen() }"
            />
          } @else if (caretGlyph(); as glyph) {
            <span aria-hidden="true" class="cngx-tree-select__caret">
              <ng-container *ngTemplateOutlet="glyph" />
            </span>
          } @else {
            <span aria-hidden="true" class="cngx-tree-select__caret">&#9662;</span>
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
        <cngx-tree-select-panel />
      </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './tree-select.component.css'],
})
export class CngxTreeSelect<T = unknown>
  implements CngxFormFieldControl, CngxSelectPanelHost<T>, CngxTreeSelectPanelHost<T>
{
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();
  private readonly autoId = nextUid('cngx-tree-select');

  // ── Inputs ─────────────────────────────────────────────────────────

  /** Source tree. Flatten/visibility derive automatically. */
  readonly nodes = input<readonly CngxTreeNode<T>[]>([]);
  /** Multi-value model — the selected subset of T. */
  readonly values = model<T[]>([]);
  /** Stable id per node. Required — see `CngxTreeControllerOptions.nodeIdFn`. */
  readonly nodeIdFn = input.required<(value: T, path: readonly number[]) => string>();
  /** Display label per node. Falls back to `node.label ?? String(value)`. */
  readonly labelFn = input<((value: T) => string) | undefined>(undefined);
  /** Membership key for selection. Defaults to identity. */
  readonly keyFn = input<((value: T) => unknown) | undefined>(undefined);
  /** Initial expansion seed (one-shot at construction). */
  readonly initiallyExpanded = input<'all' | 'none' | readonly string[] | undefined>(undefined);
  /**
   * When true, toggling a parent selects/deselects every descendant
   * atomically. A single `selectionChange` event with
   * `action: 'cascade-toggle'` is emitted.
   */
  readonly cascadeChildren = input<boolean>(false);

  readonly label = input<string>('');
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
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(
    this.config.refreshingVariant,
  );
  readonly state = input<CngxAsyncState<readonly CngxTreeNode<T>[]> | null>(null);
  readonly retryFn = input<(() => void) | null>(null);
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );

  // ── Outputs ────────────────────────────────────────────────────────

  readonly selectionChange = output<CngxTreeSelectChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();

  // ── Content-child slot queries ────────────────────────────────────

  private readonly placeholderDir = contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly caretDir = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly clearButtonDir = contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly emptyDir = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDir = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly errorDir = contentChild<CngxSelectError>(CngxSelectError);
  private readonly refreshingDir = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDir = contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly nodeDir = contentChild<CngxTreeSelectNode<T>>(CngxTreeSelectNode);

  // ── Resolved template refs ────────────────────────────────────────

  /** @internal */
  readonly placeholderTpl = injectResolvedTemplate<CngxSelectPlaceholderContext>(
    this.placeholderDir,
    'placeholder',
  );
  /** @internal */
  readonly caretTpl = injectResolvedTemplate<CngxSelectCaretContext>(this.caretDir, 'caret');
  /** @internal */
  readonly clearButtonTpl = injectResolvedTemplate<CngxSelectClearButtonContext>(
    this.clearButtonDir,
    'clearButton',
  );
  /** @internal — exposed for the shell's inline-error branch. */
  readonly errorTpl = injectResolvedTemplate<CngxSelectErrorContext>(this.errorDir, 'error');
  /** @internal */
  readonly commitErrorTpl = injectResolvedTemplate<CngxSelectCommitErrorContext<T>>(
    this.commitErrorDir,
    'commitError',
  );
  /** @internal */
  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<T>> | null> = computed(
    () => this.nodeDir()?.templateRef ?? null,
  );

  // ── View children ─────────────────────────────────────────────────

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  // ── Controllers ───────────────────────────────────────────────────

  private readonly nodesSignal: Signal<readonly CngxTreeNode<T>[]> = computed(
    () => this.nodes(),
  );

  /**
   * Signal-native tree controller. Exposed for the tree panel host.
   *
   * Lambdas are wrapped so the controller captures the *current* signal
   * value on every call — not the field-init value. Required inputs
   * (`nodeIdFn`) are not resolved at factory time; the lambda wrapper
   * defers the read to first use.
   */
  readonly treeController: CngxTreeController<T> = inject(CNGX_TREE_CONTROLLER_FACTORY)<T>({
    nodes: this.nodesSignal,
    nodeIdFn: (v, path) => this.nodeIdFn()(v, path),
    labelFn: (v) => (this.labelFn() ?? ((x: T) => String(x)))(v),
    keyFn: (v) => (this.keyFn() ?? ((x: T) => x as unknown))(v),
  });

  /**
   * Selection engine with `childrenFn` wired to the tree controller so
   * `isIndeterminate(value)` is free. Used for cascade-toggle and all
   * panel ARIA `aria-selected` / `aria-indeterminate` bindings.
   */
  private readonly selection: SelectionController<T> = inject(
    CNGX_SELECTION_CONTROLLER_FACTORY,
  )<T>(this.values, {
    keyFn: (v) => (this.keyFn() ?? ((x: T) => x as unknown))(v),
    childrenFn: (v: T) => this.treeController.childrenOfValue(v),
  });

  /** Rollback target for a commit in flight. */
  private lastCommittedValues: T[] = untracked(() => [...this.values()]);

  private readonly commitControllerInstance = inject(
    CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  )<T[]>();

  /**
   * Minimal `CngxSelectCore`-shaped surface that `createArrayCommitHandler`
   * reads (`commitController`, `togglingOption`, `announce`). Tree-select
   * doesn't use the full select-core (no flat-option model); this adapter
   * lets the shared commit handler stay unchanged.
   */
  private readonly commitCore = {
    commitController: this.commitControllerInstance,
    togglingOption: signal<never>(null as never),
    announce: (_opt: unknown, _action: string, _count: number, _multi: boolean): void => {
      // No-op MVP — live-region announcer integration lands in a follow-up.
    },
  } as unknown as Parameters<typeof createArrayCommitHandler<T>>[0]['core'];

  /** @internal */
  private readonly commitHandler: ArrayCommitHandler<T> = createArrayCommitHandler<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    core: this.commitCore,
    commitAction: this.commitAction,
    getLastCommitted: () => this.lastCommittedValues,
    onToggleFinalize: () => {
      // Tree commit success path uses dedicated `finalizeTreeChange`
      // logic below (cascade-aware). The array-commit-handler's
      // per-option finalize is bypassed by passing `null` for the
      // option — which ArrayCommitHandler treats as the clear path.
    },
    onClearFinalize: (previous, finalValues) => {
      this.cleared.emit();
      this.emitChange({
        values: finalValues,
        previousValues: previous,
        added: [],
        removed: previous,
        node: null,
        action: 'clear',
      });
    },
    onStateChange: (status) => this.stateChange.emit(status),
    onError: (err) => this.commitError.emit(err),
  });

  // ── Derived view state ────────────────────────────────────────────

  /** @internal */
  readonly activeView: Signal<AsyncView> = computed(() => {
    const s = this.state();
    if (s) {
      return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
    }
    if (this.loading()) {
      return 'skeleton';
    }
    return this.nodes().length === 0 ? 'empty' : 'content';
  });

  /** @internal */ readonly showRefreshIndicator = computed<boolean>(() => {
    const s = this.state();
    return !!s && s.status() === 'refreshing';
  });
  /** @internal */ readonly showInlineError = computed<boolean>(
    () => this.activeView() === 'content+error',
  );
  /** @internal */ readonly skeletonIndices = computed<number[]>(
    () => Array.from({ length: Math.max(1, this.skeletonRowCount()) }, (_, i) => i),
    { equal: (a, b) => a.length === b.length },
  );

  /** @internal */ readonly resolvedId = computed<string>(
    () => this.idInput() ?? this.autoId,
  );
  /** @internal */
  readonly panelClassList = computed<string | readonly string[] | null>(
    () => this.panelClass(),
  );
  /** @internal */
  readonly panelWidthCss = computed<string | null>(() => {
    const w = this.panelWidth();
    if (w === null || w === undefined) {
      return null;
    }
    if (w === 'trigger') {
      return 'var(--cngx-popover-trigger-width, auto)';
    }
    return `${w}px`;
  });
  /** @internal */ readonly resolvedListboxLabel = computed<string>(() => this.label());
  /** @internal */
  readonly ariaReadonly = computed<boolean | null>(() =>
    this.presenter?.readonly() ? true : null,
  );

  /** @internal */ readonly panelOpen = computed<boolean>(
    () => this.popoverRef()?.isVisible() ?? false,
  );

  private readonly focusedState = signal<boolean>(false);

  /** Aggregated ARIA projection for the trigger. */
  protected readonly triggerAria = computed(() => {
    const describedBy = this.presenter?.describedBy() ?? null;
    const errorMessage = this.errorState() ? describedBy : null;
    return {
      label: this.ariaLabel() ?? (this.ariaLabelledBy() ? null : this.label() || null),
      labelledBy: this.ariaLabelledBy(),
      describedBy,
      errorMessage,
      expanded: String(this.panelOpen()),
      disabled: this.disabled() ? 'true' : null,
      invalid: this.errorState() ? 'true' : null,
      required: this.requiredInput() ? 'true' : null,
      busy: this.isCommitting() || this.loading() ? 'true' : null,
    };
  });

  /** @internal */ readonly effectiveTabIndex = computed<number>(() =>
    this.disabled() ? -1 : this.tabIndex(),
  );

  // ── CngxFormFieldControl implementation ───────────────────────────

  readonly id = computed<string>(() => this.resolvedId());
  readonly focused: Signal<boolean> = this.focusedState.asReadonly();
  readonly empty = computed<boolean>(() => this.isEmpty());
  readonly disabled = computed<boolean>(
    () => this.disabledInput() || (this.presenter?.disabled() ?? false),
  );
  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  // ── CngxSelectPanelHost surface (for the shell) ───────────────────

  /**
   * Shell-required fields that have no meaning in the tree world get
   * sensible empty defaults so the shell template's branches behave
   * (empty/error/content paths) without a null-check explosion.
   *
   * @internal
   */
  readonly effectiveOptions = computed(() => [] as never[]);
  /** @internal */ readonly flatOptions = computed(() => [] as never[]);
  /** @internal */
  readonly errorContext = computed<CngxSelectErrorContext>(() => {
    const err = this.state()?.error() ?? null;
    return { $implicit: err, error: err, retry: () => this.handleRetry() };
  });
  /** @internal */
  readonly commitErrorContext = computed<CngxSelectCommitErrorContext<T>>(() => {
    const err = this.commitState.error();
    return {
      $implicit: err,
      error: err,
      option: null,
      retry: () => this.commitHandler.retryLast(),
    };
  });
  /** @internal */
  readonly tpl = {
    check: computed(() => null),
    caret: this.caretTpl,
    optgroup: computed(() => null),
    placeholder: this.placeholderTpl,
    empty: computed(() => this.emptyDir()?.templateRef ?? null),
    loading: computed(() => this.loadingDir()?.templateRef ?? null),
    optionLabel: computed(() => null),
    error: this.errorTpl,
    refreshing: computed(() => this.refreshingDir()?.templateRef ?? null),
    commitError: this.commitErrorTpl,
    clearButton: this.clearButtonTpl,
    optionPending: computed(() => null),
    optionError: computed(() => null),
  } as unknown as CngxSelectPanelHost<T>['tpl'];
  /** @internal */ readonly commitErrorValue = computed<unknown>(
    () => this.commitState.error(),
  );
  /** @internal */ readonly activeId = computed<string | null>(() => null);
  /** @internal */ readonly resolvedShowSelectionIndicator = computed<boolean>(() => true);
  /** @internal */ readonly resolvedSelectionIndicatorVariant = computed<'checkbox' | 'checkmark'>(
    () => 'checkbox',
  );
  /** @internal */ readonly resolvedSelectionIndicatorPosition = computed<'before' | 'after'>(
    () => 'before',
  );
  /** @internal */ readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );
  /** @internal */ readonly externalActivation = computed<boolean>(() => false);
  /** @internal */
  readonly showCommitError = computed<boolean>(() => this.commitState.status() === 'error');

  isGroup(_item: unknown): _item is never {
    return false;
  }
  /**
   * Satisfies both `CngxSelectPanelHost.isSelected(opt)` (option-def
   * argument) and `CngxTreeSelectPanelHost.isSelected(value)` (raw T).
   * In tree mode the flat option-loop is never rendered, so the
   * option-def overload is unreachable — still required for the type
   * system.
   */
  isSelected(x: T | { readonly value: T }): boolean {
    const value = unwrapValue<T>(x);
    return this.selection.isSelected(value)();
  }
  isIndeterminate(x: T | { readonly value: T }): boolean {
    const value = unwrapValue<T>(x);
    return this.selection.isIndeterminate(value)();
  }
  isCommittingOption(_opt: unknown): boolean {
    return false;
  }
  handleRetry(): void {
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  // ── CngxTreeSelectPanelHost extras ────────────────────────────────

  /** Exposes `keyFn` via an internal-use signal for template `track`. */
  protected readonly keyFnInternal = computed<(value: T) => unknown>(
    () => this.keyFn() ?? ((v: T) => v as unknown),
  );

  // ── Public API ────────────────────────────────────────────────────

  /** `true` when a commit is in flight. */
  readonly isCommitting = this.commitControllerInstance.isCommitting;
  /** Read-only commit lifecycle view (bridged via `CNGX_STATEFUL`). */
  readonly commitState = this.commitControllerInstance.state;

  /**
   * Resolved option-like defs of the current selection — each entry has
   * `value` + `label` so chip rendering and consumer read-back both
   * work with a stable shape.
   */
  readonly selected = computed<{ readonly value: T; readonly label: string }[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      const out: { readonly value: T; readonly label: string }[] = [];
      const label = this.resolveLabel.bind(this);
      for (const v of vals) {
        out.push({ value: v, label: label(v) });
      }
      return out;
    },
  );

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

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
      // Apply `initiallyExpanded` after inputs resolve. The controller
      // factory sees `undefined` at field-init because signal inputs
      // aren't bound yet; applying here keeps the one-shot semantic
      // aligned with the controller's contract.
      const init = this.initiallyExpanded();
      if (init === 'all') {
        this.treeController.expandAll();
      } else if (Array.isArray(init)) {
        for (const id of init as readonly string[]) {
          this.treeController.expand(id);
        }
      }
    });

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

    createFieldSync<T[]>({
      componentValue: this.values,
      valueEquals: (a, b) => sameArrayContents(a, b, this.compareWith()),
      coerceFromField: (x) => (Array.isArray(x) ? [...(x as T[])] : []),
      toFieldValue: (v) => [...v],
    });
  }

  // ── Selection / cascade flow ──────────────────────────────────────

  /**
   * Dispatch the select path for a tree node. Consumer of the
   * `CngxTreeSelectPanelHost` contract; also bound to the slot context
   * so custom `*cngxTreeSelectNode` markup routes through the same
   * cascade + commit plumbing.
   */
  handleSelect(node: FlatTreeNode<T>): void {
    if (this.disabled() || node.disabled) {
      return;
    }
    if (this.cascadeChildren() && node.hasChildren) {
      this.cascadeToggle(node);
      return;
    }
    this.singleToggle(node);
  }

  /**
   * Unified semantic-equality helper. Uses `keyFn` when provided so
   * object-valued trees match by domain id (e.g. two distinct `{ id: 'a' }`
   * references compare equal). Falls back to `compareWith` otherwise.
   * Every selection-boundary check — singleToggle, cascadeToggle,
   * chip-remove — routes through here to stay consistent with the
   * SelectionController's keyFn membership.
   */
  private readonly membersEqual = (a: T, b: T): boolean => {
    const keyFn = this.keyFn();
    if (keyFn) {
      return keyFn(a) === keyFn(b);
    }
    return this.compareWith()(a, b);
  };

  private singleToggle(node: FlatTreeNode<T>): void {
    const value = node.value;
    const previous = untracked(() => [...this.values()]);
    const wasSelected = previous.some((v) => this.membersEqual(v, value));
    const next = wasSelected
      ? previous.filter((v) => !this.membersEqual(v, value))
      : [...previous, value];

    this.dispatchValueChange(next, previous, {
      added: wasSelected ? [] : [value],
      removed: wasSelected ? [value] : [],
      node,
      action: 'toggle',
    });
  }

  private cascadeToggle(node: FlatTreeNode<T>): void {
    const descendants = this.treeController.descendantsOfValue(node.value);
    const allValues = [node.value, ...descendants];
    const previous = untracked(() => [...this.values()]);
    const parentSelected = previous.some((v) => this.membersEqual(v, node.value));

    const next = parentSelected
      ? previous.filter((v) => !allValues.some((a) => this.membersEqual(v, a)))
      : dedup([...previous, ...allValues], this.membersEqual);

    const added = parentSelected
      ? []
      : allValues.filter((a) => !previous.some((v) => this.membersEqual(v, a)));
    const removed = parentSelected
      ? allValues.filter((a) => previous.some((v) => this.membersEqual(v, a)))
      : [];

    this.dispatchValueChange(next, previous, {
      added,
      removed,
      node,
      action: 'cascade-toggle',
    });
  }

  /**
   * Unified commit dispatch for toggle + cascade-toggle paths. Bypasses
   * `ArrayCommitHandler.beginToggle` (which requires a
   * `CngxSelectOptionDef<T>` — a shape the tree world doesn't carry)
   * and talks to the low-level commit-controller directly. The
   * reconciliation / rollback semantics are identical to the
   * handler's internal `begin`; we just do not need per-option
   * finalize callbacks.
   */
  private dispatchValueChange(
    next: T[],
    previous: T[],
    meta: {
      readonly added: readonly T[];
      readonly removed: readonly T[];
      readonly node: FlatTreeNode<T>;
      readonly action: 'toggle' | 'cascade-toggle';
    },
  ): void {
    const action = this.commitAction();
    if (!action) {
      this.values.set(next);
      this.emitChange({
        values: next,
        previousValues: previous,
        added: meta.added,
        removed: meta.removed,
        node: meta.node,
        action: meta.action,
      });
      return;
    }

    this.lastCommittedValues = previous;
    if (this.commitMode() === 'optimistic') {
      this.values.set(next);
      // Emit the optimistic intent immediately so a consumer bound to
      // (selectionChange) sees the change; rollback on commit error
      // reverts `values` below.
      this.emitChange({
        values: next,
        previousValues: previous,
        added: meta.added,
        removed: meta.removed,
        node: meta.node,
        action: meta.action,
      });
    }
    this.stateChange.emit('pending');
    this.commitControllerInstance.begin(action, next, previous, {
      onSuccess: (committed) => {
        this.stateChange.emit('success');
        const finalValues = committed ?? next;
        if (!sameArrayContents(this.values(), finalValues, this.compareWith())) {
          this.values.set([...finalValues]);
        }
        this.lastCommittedValues = [...finalValues];
        if (this.commitMode() === 'pessimistic') {
          this.emitChange({
            values: finalValues,
            previousValues: previous,
            added: meta.added,
            removed: meta.removed,
            node: meta.node,
            action: meta.action,
          });
        }
      },
      onError: (err, rollbackTo) => {
        this.stateChange.emit('error');
        this.commitError.emit(err);
        if (this.commitMode() === 'optimistic') {
          this.values.set([...(rollbackTo ?? previous)]);
        }
      },
    });
  }

  // ── Trigger / chip events ─────────────────────────────────────────

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
    if ((mode === 'outside' || mode === 'both') && this.popoverRef()?.isVisible()) {
      this.close();
    }
  }

  /** @internal */
  protected handleChipRemoveClick(
    event: Event,
    opt: { readonly value: T; readonly label: string },
  ): void {
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    // Chip ✕ is a non-cascade single-deselect regardless of
    // `cascadeChildren` — the consumer explicitly removed ONE chip
    // representing ONE value. Cascade would surprise-remove invisible
    // descendants the user never picked as chips.
    const node = this.flatNodeForValue(opt.value);
    if (node) {
      this.singleToggle(node);
      return;
    }
    // Fallback: value not present in the tree (stale selection). Just
    // strip it from `values` without routing through the tree.
    const previous = untracked(() => [...this.values()]);
    const next = previous.filter((v) => !this.membersEqual(v, opt.value));
    this.values.set(next);
    this.emitChange({
      values: next,
      previousValues: previous,
      added: [],
      removed: [opt.value],
      node: null,
      action: 'toggle',
    });
  }

  /** @internal — exposed for the `*cngxSelectClearButton` slot. */
  protected readonly clearAll: () => void = () => {
    const previous = untracked(() => [...this.values()]);
    if (previous.length === 0) {
      return;
    }
    const action = this.commitAction();
    if (action) {
      this.lastCommittedValues = previous;
      if (this.commitMode() === 'optimistic') {
        this.values.set([]);
      }
      this.commitHandler.beginClear(previous, action);
      return;
    }
    this.values.set([]);
    this.cleared.emit();
    this.emitChange({
      values: [],
      previousValues: previous,
      added: [],
      removed: previous,
      node: null,
      action: 'clear',
    });
  };

  /** @internal */
  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAll();
  }

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

  // ── Helpers ───────────────────────────────────────────────────────

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  private resolveLabel(value: T): string {
    const fn = this.labelFn();
    if (fn) {
      return fn(value);
    }
    // Fallback: recover the label from the tree's flat projection. One
    // linear scan per selection-change is bounded by tree size.
    for (const n of this.treeController.flatNodes()) {
      if (this.membersEqual(n.value, value)) {
        return n.label;
      }
    }
    return String(value);
  }

  private flatNodeForValue(value: T): FlatTreeNode<T> | null {
    for (const n of this.treeController.flatNodes()) {
      if (this.membersEqual(n.value, value)) {
        return n;
      }
    }
    return null;
  }

  private emitChange(change: Omit<CngxTreeSelectChange<T>, 'source'>): void {
    this.selectionChange.emit({ ...change, source: this });
  }
}

function dedup<T>(arr: readonly T[], eq: (a: T, b: T) => boolean): T[] {
  const out: T[] = [];
  for (const v of arr) {
    if (!out.some((o) => eq(o, v))) {
      out.push(v);
    }
  }
  return out;
}

function unwrapValue<T>(x: T | { readonly value: T }): T {
  if (
    typeof x === 'object' &&
    x !== null &&
    'value' in x &&
    'label' in (x as Record<string, unknown>)
  ) {
    return (x as { readonly value: T }).value;
  }
  return x as T;
}
