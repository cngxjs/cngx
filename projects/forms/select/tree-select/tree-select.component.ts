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
import { CngxPopover, CngxPopoverTrigger, type PopoverPlacement } from '@cngx/common/popover';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  CNGX_STATEFUL,
  nextUid,
  type AsyncStatus,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';
import { CngxSelectAnnouncer } from '../shared/announcer';
import type { CngxSelectAnnouncerConfig } from '../shared/config';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
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
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
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
import {
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectPanelShellTemplates,
  type CngxSelectPanelViewHost,
} from '../shared/panel-host';
import { CNGX_SELECT_COMMIT_CONTROLLER_FACTORY } from '../shared/commit-controller.token';
import { CNGX_DISMISS_HANDLER_FACTORY } from '../shared/dismiss-handler';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { resolveSelectConfig } from '../shared/resolve-config';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
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
  CngxSelectRetryButton,
  type CngxSelectCommitErrorContext,
  type CngxSelectErrorContext,
} from '../shared/template-slots';
import { cngxSelectDefaultCompare, type CngxSelectCompareFn } from '../shared/select-core';
import { CngxTreeSelectChip } from './tree-select-chip.directive';
import { CngxTreeSelectNode } from './tree-select-node.directive';
import { CngxTreeSelectTriggerLabel } from './tree-select-trigger-label.directive';
import {
  CNGX_TREE_SELECT_PANEL_HOST,
  type CngxTreeSelectPanelHost,
} from './tree-select-panel-host';
import { CngxTreeSelectPanel } from './tree-select-panel.component';
import type {
  CngxTreeSelectAction,
  CngxTreeSelectChipContext,
  CngxTreeSelectNodeContext,
  CngxTreeSelectTriggerLabelContext,
  CngxTreeSelectedItem,
} from './tree-select.model';

/**
 * Change event emitted by `CngxTreeSelect.selectionChange`. Shape
 * matches `CngxMultiSelectChange` / `CngxComboboxChange` for shared
 * `(selectionChange)` handlers; `option` carries a `FlatTreeNode<T>`
 * (not a `CngxSelectOptionDef`). `'cascade-toggle'` fires once per
 * parent-toggle that propagated to descendants.
 *
 * @category forms/select/tree-select
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
 * Tree-structured multi-select. Shares popover + commit + focus +
 * announce plumbing with the flat family; adds `CngxTreeController` +
 * cascade selection. Body is a W3C APG treeview in
 * `CngxTreeSelectPanel`; ArrowLeft/Right via `CngxHierarchicalNav`,
 * ArrowUp/Down + Home/End + typeahead via `CngxActiveDescendant`.
 *
 * Selection:
 * - `[cascadeChildren]="false"` (default): single-value toggle;
 *   indeterminate parents reported via
 *   `SelectionController.isIndeterminate` (controller seeded with
 *   `childrenFn`).
 * - `[cascadeChildren]="true"`: parent toggle selects/deselects every
 *   descendant atomically. Single `selectionChange` with
 *   `action: 'cascade-toggle'` carries aggregated `added`/`removed`.
 *
 * @category forms/select/tree-select
 * <example-url>http://localhost:4200/tree-select/10-000-nodes-perf-smoke</example-url>
 * <example-url>http://localhost:4200/tree-select/basic-single-level-toggle</example-url>
 * <example-url>http://localhost:4200/tree-select/cascade-children-parent-toggle-selects-the-whole-subtree</example-url>
 * <example-url>http://localhost:4200/tree-select/commit-action-optimistic-pessimistic-rollback</example-url>
 * <example-url>http://localhost:4200/tree-select/custom-cngxtreeselectnode-template</example-url>
 * <example-url>http://localhost:4200/tree-select/indeterminate-propagation-pre-seeded-partial-selection</example-url>
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
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: CngxTreeSelect },
    { provide: CNGX_TREE_SELECT_PANEL_HOST, useExisting: CngxTreeSelect },
  ],
  host: {
    'class': 'cngx-tree-select',
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
        role="combobox" on a <div>, not <button>: chips and clear
        button would be invalid nested interactives. WAI-ARIA 1.2
        multi-value pattern, same as CngxMultiSelect.
      -->
      @let aria = triggerAria();
      <div
        #triggerBtn
        class="cngx-tree-select__trigger"
        role="combobox"
        [cngxPopoverTrigger]="pop"
        [haspopup]="'tree'"
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
          } @else if (triggerLabelTpl(); as labelTpl) {
            <ng-container
              *ngTemplateOutlet="
                labelTpl;
                context: {
                  $implicit: selected(),
                  selected: selected(),
                  values: values(),
                  count: selected().length
                }
              "
            />
          } @else {
            @for (opt of selected(); track keyFnInternal()(opt.value)) {
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
        [placement]="popoverPlacement()"
        class="cngx-select__panel"
        [class]="panelClassList()"
        [style.--cngx-select-panel-min-width]="panelWidthCss()"
      >
        <cngx-tree-select-panel />
      </div>
    </div>
  `,
  styleUrls: ['../shared/select-base.css', './tree-select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxTreeSelect<T = unknown>
  implements CngxFormFieldControl, CngxSelectPanelViewHost<T>, CngxTreeSelectPanelHost<T>
{
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

  // Tree virtualisation is not wired through
  // `CngxSelectConfig.virtualization`. Tree semantics — expand/collapse
  // changes visible count mid-scroll, `aria-setsize` is per-level,
  // `scrollToIndex(42)` on a collapsed ancestor needs path-expand
  // first — don't map onto the flat-list recycler integration. Tree-
  // recycler design tracked as follow-up; until then every node
  // renders regardless of the app-wide config entry.
  private readonly autoId = nextUid('cngx-tree-select');

  /** Source tree. Flatten/visibility derive automatically. */
  readonly nodes = input<readonly CngxTreeNode<T>[]>([]);
  /** Multi-value model — the selected subset of T. */
  readonly values = model<T[]>([]);
  /** Stable id per node. See `CngxTreeControllerOptions.nodeIdFn`. */
  readonly nodeIdFn = input.required<(value: T, path: readonly number[]) => string>();
  /** Display label per node. Falls back to `node.label ?? String(value)`. */
  readonly labelFn = input<((value: T) => string) | undefined>(undefined);
  /** Membership key for selection. Default identity. */
  readonly keyFn = input<((value: T) => unknown) | undefined>(undefined);
  /** Initial expansion seed (one-shot at construction). */
  readonly initiallyExpanded = input<'all' | 'none' | readonly string[] | undefined>(undefined);
  /**
   * When `true`, parent toggle selects/deselects every descendant
   * atomically; single `selectionChange` with `action: 'cascade-toggle'`.
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
  /**
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxSelectConfig.popoverPlacement`.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the default `▸` twisty glyph in the default node row.
   * Applied to both states unless `twistyOpenGlyph` is set. Ignored
   * when `*cngxTreeSelectNode` is projected.
   */
  readonly twistyGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Override for the expanded-state twisty glyph. Falls back to
   * `twistyGlyph` then to `▸` (rotated via CSS). Use when expand and
   * collapse glyphs are semantically different shapes.
   */
  readonly twistyOpenGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Forwarded to `<cngx-checkbox-indicator [checkGlyph]>` on the
   * default row. Custom node templates read `selected` and render
   * their own.
   */
  readonly checkGlyph = input<TemplateRef<void> | null>(null);
  /** Forwarded to `<cngx-checkbox-indicator [dashGlyph]>`. */
  readonly dashGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Localised aria-labels for the twisty button in the default row.
   * Falls back to English. Ignored when `*cngxTreeSelectNode` is
   * projected.
   */
  readonly twistyExpandLabel = input<string>(
    this.config.ariaLabels?.treeExpand ?? 'Expand node',
  );
  readonly twistyCollapseLabel = input<string>(
    this.config.ariaLabels?.treeCollapse ?? 'Collapse node',
  );
  readonly clearable = input<boolean>(false);
  readonly clearButtonAriaLabel = input<string>(
    this.config.ariaLabels?.clearButton ?? 'Reset selection',
  );
  readonly chipRemoveAriaLabel = input<string>(
    this.config.ariaLabels?.chipRemove ?? 'Remove',
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
  readonly announceChanges = input<boolean | null>(null);
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  readonly selectionChange = output<CngxTreeSelectChange<T>>();
  readonly openedChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly cleared = output<void>();
  readonly retry = output<void>();
  readonly commitError = output<unknown>();
  readonly stateChange = output<AsyncStatus>();

  private readonly checkDir = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly placeholderDir = contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly caretDir = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDir = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly clearButtonDir = contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly emptyDir = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDir = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly errorDir = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDir =
    contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
  private readonly refreshingDir = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDir = contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly optionLabelDir = contentChild<CngxSelectOptionLabel<T>>(
    CngxSelectOptionLabel,
  );
  private readonly optionPendingDir = contentChild<CngxSelectOptionPending<T>>(
    CngxSelectOptionPending,
  );
  private readonly optionErrorDir = contentChild<CngxSelectOptionError<T>>(
    CngxSelectOptionError,
  );

  private readonly nodeDir = contentChild<CngxTreeSelectNode<T>>(CngxTreeSelectNode);
  private readonly chipDir = contentChild<CngxTreeSelectChip<T>>(CngxTreeSelectChip);
  private readonly triggerLabelDir = contentChild<CngxTreeSelectTriggerLabel<T>>(
    CngxTreeSelectTriggerLabel,
  );

  /**
   * 13-slot template registry. Drives the `*cngxSelect*` cascade
   * (instance contentChild → `CNGX_SELECT_CONFIG.templates.*` → null).
   * Option-loop slots (check, optgroup, optionLabel, optionPending,
   * optionError) are declared for contract parity but tree-select
   * doesn't render them; projecting one is silently ignored.
   *
   * @internal
   */
  protected readonly tplRegistry = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    check: this.checkDir,
    caret: this.caretDir,
    optgroup: this.optgroupDir,
    placeholder: this.placeholderDir,
    empty: this.emptyDir,
    loading: this.loadingDir,
    optionLabel: this.optionLabelDir,
    error: this.errorDir,
    retryButton: this.retryButtonDir,
    refreshing: this.refreshingDir,
    commitError: this.commitErrorDir,
    clearButton: this.clearButtonDir,
    optionPending: this.optionPendingDir,
    optionError: this.optionErrorDir,
  });

  /** @internal */
  readonly placeholderTpl = this.tplRegistry.placeholder;
  /** @internal */
  readonly caretTpl = this.tplRegistry.caret;
  /** @internal */
  readonly clearButtonTpl = this.tplRegistry.clearButton;
  /** @internal — exposed for the shell's inline-error branch. */
  readonly errorTpl = this.tplRegistry.error;
  /** @internal — projected via `*cngxSelectRetryButton`. */
  readonly retryButtonTpl = this.tplRegistry.retryButton;
  /** @internal */
  readonly commitErrorTpl = this.tplRegistry.commitError;
  /** @internal */
  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<T>> | null> = computed(
    () => this.nodeDir()?.templateRef ?? null,
  );
  /** @internal — per-chip override in the trigger strip. */
  protected readonly chipTpl = computed<TemplateRef<CngxTreeSelectChipContext<T>> | null>(
    () => this.chipDir()?.templateRef ?? null,
  );
  /** @internal — whole-strip override in the trigger. Mutually exclusive with chipTpl. */
  protected readonly triggerLabelTpl = computed<
    TemplateRef<CngxTreeSelectTriggerLabelContext<T>> | null
  >(() => this.triggerLabelDir()?.templateRef ?? null);

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  /**
   * Tree controller. Lambdas wrap each input read so the controller
   * sees the *current* signal value on every call — required inputs
   * like `nodeIdFn` aren't resolved at factory time.
   */
  readonly treeController: CngxTreeController<T> = inject(CNGX_TREE_CONTROLLER_FACTORY)<T>({
    nodes: this.nodes,
    nodeIdFn: (v, path) => this.nodeIdFn()(v, path),
    labelFn: (v) => (this.labelFn() ?? ((x: T) => String(x)))(v),
    keyFn: (v) => (this.keyFn() ?? ((x: T) => x as unknown))(v),
  });

  /**
   * Selection engine seeded with `childrenFn` so
   * `isIndeterminate(value)` is free. Drives cascade-toggle and panel
   * `aria-selected` / `aria-indeterminate`.
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

  /** Shared live-region announcer. */
  private readonly announcer = inject(CngxSelectAnnouncer);

  /**
   * Emit an action-aware message through the root live region. Gated
   * by `[announceChanges]` → config → default `true`. Message comes
   * from `[announceTemplate]` or the config's format function.
   */
  private announce(
    item: CngxTreeSelectedItem<T> | null,
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
    const aria = this.ariaLabel();
    let fieldLabel = this.config.ariaLabels?.fieldLabelFallback ?? 'Selection';
    if (label.length > 0) {
      fieldLabel = label;
    } else if (aria && aria.length > 0) {
      fieldLabel = aria;
    }
    const message = format({
      selectedLabel: item?.label ?? null,
      fieldLabel,
      multi: true,
      action,
      count,
    });
    this.announcer.announce(message, announcerConfig.politeness);
  }

  /**
   * Minimal `CngxSelectCore`-shaped surface for
   * `createArrayCommitHandler` — handler only reads `commitController`,
   * `togglingOption`, `announce`. Tree-select drives toggle + cascade
   * via `dispatchValueChange` directly; the handler is reused only
   * for clear-all. `togglingOption` is typed honestly — the clear
   * path's `.set(null)` is its only runtime use.
   */
  private readonly commitCore: Parameters<typeof createArrayCommitHandler<T>>[0]['core'] = {
    commitController: this.commitControllerInstance,
    togglingOption: signal(null),
    announce: (_opt: unknown, action: 'added' | 'removed', count: number): void => {
      // `beginClear` calls with `null` option + 'removed'. Forward to
      // the tree-shaped announce helper.
      this.announce(null, action, count);
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
      // Tree commit success uses cascade-aware
      // `dispatchValueChange` directly. The handler's per-option
      // finalize is bypassed because the clear path passes
      // `null` option (treated as clear by ArrayCommitHandler).
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
  /** @internal — own template only; outer popover panel class binding. */
  protected readonly panelClassList = computed<string | readonly string[] | null>(
    () => this.panelClass(),
  );
  /** @internal — own template only; outer popover panel width binding. */
  protected readonly panelWidthCss = computed<string | null>(() => {
    const w = this.panelWidth();
    if (w === null || w === undefined) {
      return null;
    }
    if (w === 'trigger') {
      return 'var(--cngx-popover-trigger-width, auto)';
    }
    return `${w}px`;
  });
  /** @internal */
  readonly ariaReadonly = computed<boolean | null>(() =>
    this.presenter?.readonly() ? true : null,
  );

  /** @internal */ readonly panelOpen = computed<boolean>(
    () => this.popoverRef()?.isVisible() ?? false,
  );

  /**
   * DI-resolved focus state. Same override surface as the rest of the
   * family (telemetry / controlled-from-outside / test doubles).
   */
  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();

  /**
   * Aggregated ARIA projection for the trigger. Structural-equal on
   * every field so `@let aria = triggerAria()` doesn't churn on
   * unrelated state changes.
   */
  protected readonly triggerAria = computed(
    () => {
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
    },
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

  /** @internal */ readonly effectiveTabIndex = computed<number>(() =>
    this.disabled() ? -1 : this.tabIndex(),
  );

  readonly id = computed<string>(() => this.resolvedId());
  readonly focused: Signal<boolean> = this.focusState.focused;
  readonly empty = computed<boolean>(() => this.isEmpty());
  readonly disabled = computed<boolean>(
    () => this.disabledInput() || (this.presenter?.disabled() ?? false),
  );
  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  /** @internal — panel-shell fallback labels (i18n). */
  readonly fallbackLabels = this.config.fallbackLabels;
  readonly ariaLabels = this.config.ariaLabels;

  /**
   * Stable retry closure bound once so the `errorContext` computed
   * stays reference-stable; only `error` / `$implicit` vary.
   */
  private readonly errorRetryBound: () => void = () => this.handleRetry();

  /** @internal */
  readonly errorContext = computed<CngxSelectErrorContext>(
    () => {
      const err = this.state()?.error() ?? null;
      return { $implicit: err, error: err, retry: this.errorRetryBound };
    },
    {
      // Structural-equal on `error` + identity-check the stable retry
      // closure — identical error reads stop thrashing the retry banner
      // outlet. Parallel pattern to `commitErrorContext`.
      equal: (a, b) =>
        a === b ||
        (Object.is(a.error, b.error) &&
          Object.is(a.$implicit, b.$implicit) &&
          a.retry === b.retry),
    },
  );

  // Stable retry closure — recreating per CD cycle churns
  // `*ngTemplateOutlet` consumers of the commit-error context.
  private readonly commitRetryBound: () => void = () => this.commitHandler.retryLast();

  /** @internal */
  readonly commitErrorContext = computed<CngxSelectCommitErrorContext<T>>(
    () => ({
      $implicit: this.commitState.error(),
      error: this.commitState.error(),
      option: null,
      retry: this.commitRetryBound,
    }),
    {
      equal: (a, b) =>
        a === b ||
        (Object.is(a.error, b.error) &&
          Object.is(a.$implicit, b.$implicit) &&
          a.retry === b.retry &&
          a.option === b.option),
    },
  );

  /**
   * 5-slot bundle the shell reads. Tree-select has no flat option-
   * loop, so no `check` / `optgroup` / `optionLabel`.
   *
   * @internal
   */
  readonly tpl: CngxSelectPanelShellTemplates<T> = {
    loading: this.tplRegistry.loading,
    empty: this.tplRegistry.empty,
    error: this.tplRegistry.error,
    retryButton: this.tplRegistry.retryButton,
    loadingGlyph: this.tplRegistry.loadingGlyph,
    refreshing: this.tplRegistry.refreshing,
    commitError: this.tplRegistry.commitError,
    // No inline action slot today (master-plan §9 —
    // `CngxActionTreeSelect` is a follow-up). Shell falls back when
    // null, so a stray `*cngxSelectAction` projection at this level is
    // silently suppressed.
    action: signal<null>(null),
  };

  /** @internal */
  readonly showCommitError = computed<boolean>(() => this.commitState.status() === 'error');

  isSelected(value: T): boolean {
    return this.selection.isSelected(value)();
  }
  isIndeterminate(value: T): boolean {
    return this.selection.isIndeterminate(value)();
  }
  handleRetry(): void {
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** `keyFn` exposed for template `track`. */
  protected readonly keyFnInternal = computed<(value: T) => unknown>(
    () => this.keyFn() ?? ((v: T) => v as unknown),
  );

  /** `true` when a commit is in flight. */
  readonly isCommitting = this.commitControllerInstance.isCommitting;
  /** Read-only commit lifecycle view (bridged via `CNGX_STATEFUL`). */
  readonly commitState = this.commitControllerInstance.state;

  /**
   * Resolved option-like defs of the current selection. Structural
   * equal (length + pairwise `compareWith` on value + label string)
   * so chip-strip `@for` and consumer `selected()` reads don't
   * cascade-rerender on server refetch.
   */
  readonly selected = computed<readonly CngxTreeSelectedItem<T>[]>(
    () => {
      const vals = this.values();
      if (vals.length === 0) {
        return [];
      }
      const out: CngxTreeSelectedItem<T>[] = [];
      const label = this.resolveLabel.bind(this);
      for (const v of vals) {
        out.push({ value: v, label: label(v) });
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
        const eq = this.compareWith();
        for (let i = 0; i < a.length; i++) {
          if (!eq(a[i].value, b[i].value) || a[i].label !== b[i].label) {
            return false;
          }
        }
        return true;
      },
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
      // sees `undefined` at field-init because signal inputs aren't
      // bound yet; applying here keeps one-shot semantics.
      const init = this.initiallyExpanded();
      if (init === 'all') {
        this.treeController.expandAll();
      } else if (Array.isArray(init)) {
        for (const id of init as readonly string[]) {
          this.treeController.expand(id);
        }
      }
    });

    inject(CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY)({
      panelOpen: this.panelOpen,
      restoreFocusTarget: this.triggerBtn,
      restoreFocus: this.config.restoreFocus,
      openedChange: this.openedChange,
      opened: this.opened,
      closed: this.closed,
    });

    createFieldSync<T[]>({
      componentValue: this.values,
      valueEquals: (a, b) => sameArrayContents(a, b, this.compareWith()),
      coerceFromField: (x) => (Array.isArray(x) ? [...(x as T[])] : []),
      toFieldValue: (v) => [...v],
    });
  }

  /**
   * Select path for a tree node. Used both by the
   * `CngxTreeSelectPanelHost` contract and by the slot context, so
   * custom `*cngxTreeSelectNode` markup routes through the same
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
   * Semantic equality. Uses `keyFn` when provided so object-valued
   * trees match by domain id (two `{ id: 'a' }` instances compare
   * equal); falls back to `compareWith`. Every selection-boundary
   * check routes through here to stay consistent with the
   * `SelectionController`'s keyFn membership.
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
   * Commit dispatch for toggle + cascade-toggle. Bypasses
   * `ArrayCommitHandler.beginToggle` (its `CngxSelectOptionDef<T>`
   * shape doesn't fit the tree world) and drives the commit-controller
   * directly; reconciliation and rollback semantics match.
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
    // Announce: single-toggle reports the node's label + direction;
    // cascade-toggle has many added/removed, so announce a null-label
    // with the count (format function's `selectedLabel: null` path).
    const announceLabel = meta.action === 'toggle' ? meta.node.label : null;
    const announceAction: 'added' | 'removed' =
      meta.added.length > 0 ? 'added' : 'removed';
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
      this.announce(
        announceLabel ? { value: meta.node.value, label: announceLabel } : null,
        announceAction,
        next.length,
      );
      return;
    }

    this.lastCommittedValues = previous;
    if (this.commitMode() === 'optimistic') {
      this.values.set(next);
      // Emit the intent immediately so `(selectionChange)` consumers
      // see the change; rollback on commit error reverts `values`.
      this.emitChange({
        values: next,
        previousValues: previous,
        added: meta.added,
        removed: meta.removed,
        node: meta.node,
        action: meta.action,
      });
      this.announce(
        announceLabel ? { value: meta.node.value, label: announceLabel } : null,
        announceAction,
        next.length,
      );
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
          this.announce(
            announceLabel ? { value: meta.node.value, label: announceLabel } : null,
            announceAction,
            finalValues.length,
          );
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

  /** @internal */
  protected handleTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggle();
  }

  /**
   * Combobox-style trigger keyboard. ArrowDown/Up/Enter/Space open the
   * panel when closed (panel AD takes over once focus transfers);
   * Escape closes when open. WAI-ARIA 1.2 combobox.
   *
   * @internal
   */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const key = event.key;
    if (this.panelOpen()) {
      if (key === 'Escape') {
        event.preventDefault();
        this.close();
      }
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.open();
    }
  }

  /** @internal — click-outside dismissal (no action bridge on tree-select). */
  protected readonly handleClickOutside = inject(CNGX_DISMISS_HANDLER_FACTORY)({
    popoverRef: this.popoverRef,
    dismissOn: this.config.dismissOn,
  }).handleClickOutside;

  /** @internal */
  protected handleChipRemoveClick(
    event: Event,
    opt: CngxTreeSelectedItem<T>,
  ): void {
    event.stopPropagation();
    this.removeSelectedItem(opt);
  }

  /**
   * Chip-removal handler. Uses `removeOverride` so the factory absorbs
   * the disabled-guard + WeakMap closure cache while the override
   * keeps the tree-aware mutation path:
   *
   *   - in-tree value → `singleToggle(node)` (always single-deselect,
   *     never cascades, even with `[cascadeChildren]="true"`).
   *   - stale value (not in tree) → strip from `values` + emit +
   *     announce.
   *
   * Standard sync/commit branches are bypassed because
   * `dispatchValueChange` (via `singleToggle`) owns commit-action,
   * optimistic write, and rollback for the tree world.
   */
  private readonly chipRemovalHandler: CngxChipRemovalHandler<CngxTreeSelectedItem<T>> =
    inject(CNGX_CHIP_REMOVAL_HANDLER_FACTORY)<T, CngxTreeSelectedItem<T>>({
      disabled: this.disabled,
      removeOverride: (item) => this.removeSelectedItem(item),
    });

  /** @internal — stable remove callback for `*cngxTreeSelectChip` context. */
  protected chipRemoveFor(opt: CngxTreeSelectedItem<T>): () => void {
    return this.chipRemovalHandler.removeFor(opt);
  }

  /**
   * Shared removal path for chip × and the `remove` callback in
   * `*cngxTreeSelectChip`. Always single-deselect regardless of
   * `cascadeChildren` — the consumer removed ONE chip for ONE value;
   * cascade would surprise-remove invisible descendants.
   *
   * Disabled-guard lives in the handler; this method assumes safe.
   */
  private removeSelectedItem(opt: CngxTreeSelectedItem<T>): void {
    const node = this.flatNodeForValue(opt.value);
    if (node) {
      this.singleToggle(node);
      return;
    }
    // Stale selection (value not in tree). Strip from `values`
    // without routing through the tree.
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
    this.announce({ value: opt.value, label: opt.label }, 'removed', next.length);
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
    this.announce(null, 'removed', 0);
  };

  /** @internal */
  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAll();
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

  protected isEmpty(): boolean {
    return this.values().length === 0;
  }

  private resolveLabel(value: T): string {
    const fn = this.labelFn();
    if (fn) {
      return fn(value);
    }
    // O(1) via the tree-controller's value index.
    return this.treeController.findByValue(value)?.label ?? String(value);
  }

  private flatNodeForValue(value: T): FlatTreeNode<T> | null {
    return this.treeController.findByValue(value) ?? null;
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
