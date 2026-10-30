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
  viewChild,
  type ElementRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { CngxChip, CngxIconSvg } from '@cngx/common/display';
import {
  CngxClickOutside,
  CNGX_TREE_CONTROLLER_FACTORY,
  type CngxTreeController,
} from '@cngx/common/interactive';
import {
  CngxPopover,
  CngxPopoverSheet,
  CngxPopoverTrigger,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationRequest,
  type PopoverPlacement,
} from '@cngx/common/popover';
import {
  CNGX_SELECTION_CONTROLLER_FACTORY,
  CNGX_STATEFUL,
  nextUid,
  type AsyncStatus,
  type CngxAsyncState,
  type SelectionController,
} from '@cngx/core/utils';
import { injectSelectCopy } from '../i18n/select-i18n';
import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_SELECT_SHEET_SCOPE,
  CngxScopedSelectAnnouncer,
} from '../shared/internal/scoped-announcer';
import { createSelectCore, type CngxSelectCore } from '../shared/internal/select-core';
import { createOptionsStateView } from '../shared/internal/options-state-view';
import {
  createSelectSheetWiring,
  type CngxSelectSheetWiring,
} from '../shared/internal/select-sheet-wiring';
import { CngxSelectSheetHeader } from '../shared/internal/sheet-header/sheet-header.component';
import { CNGX_SELECT_SHEET_HEADER_HOST } from '../shared/sheet-header-host';
import type {
  CngxSelectAnnouncerConfig,
  CngxSelectLoadingVariant,
  CngxSelectRefreshingVariant,
} from '../shared/config';
import { CNGX_TRIGGER_FOCUS_FACTORY } from '../shared/trigger-focus';
import { createHostFocusWithin } from '../shared/internal/host-focus-within';
import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFieldSkinHost,
  CngxFormFieldPresenter,
  type CngxFormFieldControl,
} from '@cngx/forms/field';
import {
  type CngxTreeNode,
  type FlatTreeNode,
  CNGX_ICON_CARET_DOWN,
  CNGX_ICON_X,
} from '@cngx/utils';

import { createArrayCommitHandler, type ArrayCommitHandler } from '../shared/array-commit-handler';
import {
  CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY,
  type CngxCommitErrorAnnouncePolicy,
} from '../shared/commit-error-announcer';
import {
  CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  type CngxChipRemovalHandler,
} from '../shared/chip-removal-handler';
import {
  type CngxSelectCommitAction,
  type CngxSelectCommitErrorDisplay,
  type CngxSelectCommitMode,
} from '../shared/commit-action.types';
import { sameArrayContents } from '../shared/internal/compare';
import { CngxSelectSummary } from '../shared/internal/summary/select-summary.component';
import { createSelectSummary } from '../shared/internal/summary/select-summary';
import { injectTouchFloorSignal } from '../shared/internal/touch-floor';
import { createFieldSync } from '../shared/field-sync';
import {
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectPanelShellTemplates,
  type CngxSelectPanelViewHost,
} from '../shared/panel-host';
import { CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY } from '../shared/panel-lifecycle-emitter';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { CNGX_TEMPLATE_REGISTRY_FACTORY } from '../shared/template-registry';
import {
  CngxSelectCaret,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectLoadingGlyph,
  CngxSelectSheetHandle,
  CngxSelectSheetCount,
  CngxSelectChipOverflow,
  type CngxSelectChipOverflowContext,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  CngxSelectRetryButton,
} from '../shared/template-slots';
import { cngxSelectDefaultCompare, type CngxSelectCompareFn } from '../shared/internal/select-core';
import { CngxTreeSelectChip } from './tree-select-chip.directive';
import { CngxTreeSelectNode } from './tree-select-node.directive';
import { CngxTreeSelectTriggerLabel } from './tree-select-trigger-label.directive';
import {
  CNGX_TREE_SELECT_PANEL_HOST,
  type CngxTreeSelectPanelHost,
} from './tree-select-panel-host';
import { CngxTreeSelectPanel } from './tree-select-panel.component';
import { createTreeChipDisplay } from './internal/tree-chip-display';
import { createTreeSelectionCounts } from './internal/tree-selection-counts';
import { CngxTreeSelectNodeCount } from './tree-select-node-count.directive';
import { CngxTreeSelectFooter } from './tree-select-footer.directive';
import { injectResolvedTemplate } from '../shared/internal/resolve-template';
import { createTreeToggleDispatch, type TreeToggleDispatch } from './internal/tree-toggle-dispatch';
import type {
  CngxTreeSelectAction,
  CngxTreeSelectChipContext,
  CngxTreeSelectChipDisplay,
  CngxTreeSelectNodeContext,
  CngxTreeSelectFooterContext,
  CngxTreeSelectNodeCountContext,
  CngxTreeSelectTriggerLabelContext,
  CngxTreeSelectedItem,
} from './tree-select.model';

const TRUNCATE: Signal<'wrap' | 'scroll-x' | 'truncate'> = signal<
  'wrap' | 'scroll-x' | 'truncate'
>('truncate').asReadonly();

/**
 * Change event emitted by `CngxTreeSelect.selectionChange`. Shape
 * matches `CngxMultiSelectChange` / `CngxComboboxChange` for shared
 * `(selectionChange)` handlers; `option` carries a `FlatTreeNode<T>`
 * (not a `CngxSelectOptionDef`). `'cascade-toggle'` fires once per
 * parent-toggle that propagated to descendants. `node.id` and
 * `node.parentIds` carry the per-instance prefix
 * (`<instance prefix>-<nodeIdFn result>`).
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
 * Tree-structured multi-select. Runs on `createSelectCore` like the flat
 * family (commit, announce, panel view state, trigger ARIA), with the
 * tree's flat node list as the option source; adds `CngxTreeController` +
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
 * Slot tiers: `cngxSelectCaret`, `cngxSelectPlaceholder`, `cngxSelectEmpty`,
 * `cngxSelectLoading`, `cngxSelectError`, `cngxSelectRetryButton`,
 * `cngxSelectRefreshing`, `cngxSelectCommitError` and
 * `cngxSelectClearButton` also take an app-wide default through
 * `CNGX_SELECT_CONFIG.templates` (`withTemplates`); `cngxTreeSelectNode`,
 * `cngxTreeSelectChip` and `cngxTreeSelectTriggerLabel` are
 * directive-only. `cngxSelectLoadingGlyph` resolves from the projected
 * directive first and `templates.loadingGlyph` second. Rows and their
 * hard-coded checkbox are replaced through `cngxTreeSelectNode`; the
 * option-loop slots `cngxSelectCheck`, `cngxSelectOptgroup`,
 * `cngxSelectOptionLabel`, `cngxSelectOptionPending` and
 * `cngxSelectOptionError` do not exist on this host.
 *
 * **Mobile sheet.** On a coarse screen narrower than 48rem the panel opens as
 * a modal bottom sheet: a `role="dialog"` named by the field label, with a
 * close button, Done and a decorative handle (`*cngxSelectSheetHandle`).
 * Focus moves into the sheet on open and back to the trigger on close, the
 * rest of the page is inert, and announcements are spoken from inside the
 * sheet. `[presentation]` forces `'anchored'`, `'sheet'` or `'fullscreen'`;
 * `withMobileSheet('off')` keeps every select in its scope anchored.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/tree-select/tree-select.component.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxSelect, CngxReorderableMultiSelect, CngxTreeSelectNode, CngxTreeSelectChip
 * @playground Material theme ./examples/material-theme/material-theme.component.ts
 * <example-url>http://localhost:4200/#/forms/select/tree-select/basic-single-level-toggle</example-url>
 * <example-url>http://localhost:4200/#/forms/select/tree-select/cascade-children-parent-toggle-selects-the-whole-subtree</example-url>
 * <example-url>http://localhost:4200/#/forms/select/tree-select/custom-cngxtreeselectnode-template</example-url>
 * <example-url>http://localhost:4200/#/forms/select/tree-select/chip-display-parents-leaves-all</example-url>
 * <example-url>http://localhost:4200/#/forms/select/tree-select/custom-count-footer-and-overflow-slots</example-url>
 * <example-url>http://localhost:4200/#/forms/select/tree-select/touch-row-tap-expands-checkbox-selects</example-url>
 * <example-url>http://localhost:4200/#/forms/select/mobile-sheet/all-variants</example-url>
 * @slot cngxSelectCaret Replaces the trigger caret unless hideCaret is set; gets open.
 * @slot cngxSelectPlaceholder Renders in the trigger while nothing is selected; gets placeholder.
 * @slot cngxSelectEmpty Replaces the panel's empty message when the tree has no nodes; searchTerm is always '' on this host.
 * @slot cngxSelectLoading Replaces the panel's loading indicator during the first load of [state], or while [loading] is true without [state]; gets retry.
 * @slot cngxSelectLoadingGlyph Replaces the inner glyph of the spinner or bar loading view and of the refresh indicator when no cngxSelectLoading / cngxSelectRefreshing template is set; no context.
 * @slot cngxSelectError Replaces the panel's error block on a failed load and the inline error above the tree on a failed refresh; gets error, retry.
 * @slot cngxSelectRetryButton Replaces the retry button inside the built-in load-error, inline-error and commit-error blocks; gets retry, error, disabled, label.
 * @slot cngxSelectRefreshing Replaces the refresh indicator shown above the tree while a reload runs; previousCount is always 0 on this host.
 * @slot cngxSelectCommitError Replaces the panel's commit-error banner when a commit fails and commitErrorDisplay is 'banner'; gets error and retry (option is always null on this host).
 * @slot cngxSelectClearButton Replaces the clear-all button, shown when clearable is set, a value is selected and the control is enabled; gets clear, disabled.
 * @slot cngxTreeSelectNode Replaces each whole treeitem row, twisty and checkbox included, so the template owns the treeitem ARIA; gets node, depth, expanded, hasChildren, selected, indeterminate, disabled, selectedCount, descendantCount, toggleExpand, handleSelect.
 * @slot cngxTreeSelectChip Replaces each chip in the trigger strip unless cngxTreeSelectTriggerLabel is projected; gets option, remove. Fine pointer only.
 * @slot cngxTreeSelectTriggerLabel Replaces the whole chip strip, and the touch summary, while at least one value is selected; gets selected, values, count.
 * @slot cngxTreeSelectNodeCount Replaces the selected-of-total count at the inline end of each parent row in the default row; gets text ($implicit), selected, total, node. The built-in count shows only once a descendant is selected; the template renders for every parent, zero included. Renders inside an aria-hidden wrapper the host keeps; global default via CNGX_SELECT_CONFIG.templates.treeNodeCount.
 * @slot cngxTreeSelectFooter Replaces the panel footer below the tree (selected count and clear-all; the bottom bar in the mobile sheet); gets count ($implicit), countText, clear, clearLabel, empty. clear() keeps the host's clear announcement and outputs; global default via CNGX_SELECT_CONFIG.templates.treeFooter.
 * @slot cngxSelectChipOverflow Replaces the `+N` overflow chip after the first maxVisibleChips displayed chips, and the badge of the touch summary; gets count, label, hidden. The `+N` chip is fine pointer only. The host keeps the hidden values readable for AT.
 * @slot cngxSelectSheetCount Replaces the selected count after the mobile sheet title; gets text ($implicit). Global default via CNGX_SELECT_CONFIG.templates.sheetCount.
 * @slot cngxSelectSheetHandle Replaces the decorative drag handle of the mobile sheet, inside an aria-hidden wrapper; gets $implicit/presentation, dragging.
 * @axis level organism
 */
@Component({
  selector: 'cngx-tree-select',
  exportAs: 'cngxTreeSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxIconSvg,
    CngxPopoverSheet,
    CngxSelectSheetHeader,
    CngxChip,
    CngxClickOutside,
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectSummary,
    CngxTreeSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CngxSelectAnnouncer, useClass: CngxScopedSelectAnnouncer },
    { provide: CNGX_SELECT_SHEET_SCOPE, useFactory: () => inject(CngxTreeSelect).sheetWiring },
    {
      provide: CNGX_SELECT_SHEET_HEADER_HOST,
      useFactory: () => inject(CngxTreeSelect).sheetWiring.headerHost,
    },
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
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    class: 'cngx-tree-select',
    '[id]': 'resolvedId()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '(focusin)': 'hostFocus.handleFocusIn()',
    '(focusout)': 'hostFocus.handleFocusOut($event)',
  },
  templateUrl: './tree-select.component.html',
  styleUrls: ['../shared/select-base.css', './tree-select.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CngxTreeSelect<T = unknown>
  implements CngxFormFieldControl, CngxSelectPanelViewHost<T>, CngxTreeSelectPanelHost<T>
{
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = resolveSelectConfig();

  // Tree virtualisation is not wired through
  // `CngxSelectConfig.virtualization`. Tree semantics - expand/collapse
  // changes visible count mid-scroll, `aria-setsize` is per-level,
  // `scrollToIndex(42)` on a collapsed ancestor needs path-expand
  // first - don't map onto the flat-list recycler integration. Tree-
  // recycler design tracked as follow-up; until then every node
  // renders regardless of the app-wide config entry.

  /**
   * Per-instance prefix on every node id, so two trees on one page never
   * share a treeitem DOM id or an `aria-activedescendant` target.
   */
  private readonly nodeIdPrefix = nextUid('cngx-tree-select');

  /** Source tree. Flatten/visibility derive automatically. */
  readonly nodes = input<readonly CngxTreeNode<T>[]>([]);
  /**
   * Selected values, two-way bindable as `[(values)]`. Syncs with the bound
   * field inside a `cngx-form-field`.
   */
  readonly values = model<T[]>([]);
  /**
   * Stable id per node. See `CngxTreeControllerOptions.nodeIdFn`. The tree
   * prefixes it per instance: `node.id`, `node.parentIds` and every
   * `treeController` id read `<instance prefix>-<nodeIdFn result>`. Pass
   * those ids back unchanged; look a node up by value
   * (`treeController.findByValue`) instead of rebuilding its id.
   * `[initiallyExpanded]` keeps taking raw `nodeIdFn` ids.
   */
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
  /**
   * Which selected values the trigger shows as chips. `'parents'` shows a
   * fully selected subtree (the node and every non-disabled descendant
   * selected) as one chip for its topmost node, and removing that chip
   * deselects the subtree; `'leaves'` hides a fully selected parent and
   * shows its descendants; `'all'` shows one chip per value, each removing
   * only its value. Default: `'parents'` with `[cascadeChildren]="true"`,
   * else `'all'`. `selected()` and the `*cngxTreeSelectTriggerLabel`
   * context always carry the full selection.
   */
  readonly chipDisplay = input<CngxTreeSelectChipDisplay | undefined>(undefined);
  /**
   * Chip cap of the one-line trigger strip on a fine pointer; the rest shows
   * as a `+N` overflow chip (`*cngxSelectChipOverflow` replaces it). Counts
   * displayed chips (see `chipDisplay`). Defaults to
   * `CngxSelectConfig.maxVisibleChips`.
   */
  readonly maxVisibleChips = input<number>(this.config.maxVisibleChips);
  /** @internal */
  protected readonly resolvedChipDisplay = computed<CngxTreeSelectChipDisplay>(
    () => this.chipDisplay() ?? (this.cascadeChildren() ? 'parents' : 'all'),
  );
  /**
   * Opt-in expand-to-reveal type-to-find. When `true`, a typeahead
   * query with no match among the VISIBLE nodes searches the full
   * flat tree; the first match gets its ancestors expanded
   * (`treeController.reveal`) and the highlight moves onto it. The
   * default `false` keeps the APG baseline: typeahead only walks the
   * rendered (visible) nodes and a hidden match stays hidden.
   *
   * Matching mirrors the typeahead of `CngxActiveDescendant`:
   * case-insensitive `startsWith`, disabled nodes skipped. The
   * highlight lands on the first node whose value matches
   * (`Object.is` semantics) - on a tree with duplicated values the
   * highlighted node can differ from the revealed one, so unique
   * values are recommended (matching the `nodeIdFn` uniqueness
   * contract).
   */
  readonly expandToReveal = input<boolean>(false);

  /**
   * Field label. Names the trigger when neither `aria-label` nor
   * `aria-labelledby` is set, names the listbox, and stands in for an empty
   * `placeholder`.
   */
  readonly label = input<string>('');
  /** Trigger text while nothing is selected; falls back to `label` when unset. */
  readonly placeholder = input<string>('');
  /**
   * Disables the trigger and the panel. Merges with the disabled state of an
   * enclosing `cngx-form-field`.
   */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
  /**
   * Marks the control as required and sets `aria-required`. Merges with the
   * required state of an enclosing `cngx-form-field`.
   */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });
  /** Equality function that matches values to options. Defaults to `Object.is`. */
  readonly compareWith = input<CngxSelectCompareFn<T>>(
    cngxSelectDefaultCompare as CngxSelectCompareFn<T>,
  );
  /** Host id. Unset, it takes the input id of an enclosing `cngx-form-field`. */
  readonly idInput = input<string | null>(null, { alias: 'id' });
  /**
   * Accessible name of the trigger. Wins over `label`; inside a
   * `cngx-form-field` the field label referenced through `aria-labelledby`
   * takes precedence.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /**
   * Id of the element that names the trigger. Unset, it takes the label id of
   * an enclosing `cngx-form-field`.
   */
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });
  /** Tab index of the trigger. Defaults to `0`; a disabled control always uses `-1`. */
  readonly tabIndex = input<number>(0);
  /** Focuses the trigger once after the first render. */
  readonly autofocus = input<boolean>(false);
  /** Classes on the panel root, merged with `CngxSelectConfig.panelClass`. */
  readonly panelClass = input<string | readonly string[] | null>(null);
  /**
   * Panel min-width: `'trigger'` matches the trigger width, a number sets
   * pixels, `null` sizes to content. Defaults to `CngxSelectConfig.panelWidth`.
   */
  readonly panelWidth = input<'trigger' | number | null>(this.config.panelWidth);
  /**
   * Popover placement relative to the trigger. Per-instance input wins
   * over `CngxSelectConfig.popoverPlacement`. A centred `'bottom'` / `'top'`
   * aligns the tree panel to the trigger's inline-start edge, since the panel
   * can be wider than the trigger.
   */
  readonly popoverPlacement = input<PopoverPlacement>(this.config.popoverPlacement);
  /**
   * @internal - a centred block placement starts at the trigger's inline-start
   * edge instead: the tree panel is wider than a narrow trigger and grows
   * toward inline-end (the popover mirrors `-start` under RTL, and its
   * `flip-inline` fallback keeps the viewport collision recovery).
   */
  protected readonly resolvedPopoverPlacement = computed<PopoverPlacement>(() => {
    const placement = this.popoverPlacement();
    if (placement === 'bottom') {
      return 'bottom-start';
    }
    return placement === 'top' ? 'top-start' : placement;
  });
  /** Hides the trigger caret. Defaults to the inverse of `CngxSelectConfig.showCaret`. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);
  /**
   * Replaces the built-in clear glyph inside the default clear button while
   * keeping the button frame, ARIA and click handler. Ignored when
   * `*cngxSelectClearButton` is projected.
   */
  readonly clearGlyph = input<TemplateRef<void> | null>(null);
  /** Replaces the built-in caret glyph. Ignored when `*cngxSelectCaret` is projected. */
  readonly caretGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Replaces the default chevron twisty in the default node row.
   * Applied to both states unless `twistyOpenGlyph` is set. Ignored
   * when `*cngxTreeSelectNode` is projected.
   */
  readonly twistyGlyph = input<TemplateRef<void> | null>(null);
  /**
   * Override for the expanded-state twisty glyph. Falls back to
   * `twistyGlyph` then to the chevron (rotated via CSS). Use when expand and
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
  /** Renders a clear button while the selection is not empty and the control is enabled. */
  readonly clearable = input<boolean>(false);
  /** @internal The select section at this reading site; per-variant defaults. */
  private readonly selectCopy = injectSelectCopy();
  /**
   * Accessible name of the clear button. Unset, it reads
   * `CngxSelectConfig.ariaLabels.clearButton`, then the select copy of the
   * active language.
   */
  readonly clearButtonAriaLabel = input<string | undefined>(undefined);
  protected readonly caretIcon = CNGX_ICON_CARET_DOWN;
  protected readonly clearIcon = CNGX_ICON_X;
  /** @internal Bound value, else the config copy; follows a language switch. */
  protected readonly resolvedClearButtonAriaLabel = computed<string>(
    () =>
      this.clearButtonAriaLabel() ??
      this.config.ariaLabels().clearButton ??
      this.selectCopy().resetSelection,
  );
  /**
   * Accessible name of the remove button on each chip, combined with the chip
   * label. Unset, it reads `CngxSelectConfig.ariaLabels.chipRemove`.
   */
  readonly chipRemoveAriaLabel = input<string | undefined>(undefined);
  /** @internal Bound value, else the config copy; follows a language switch. */
  protected readonly resolvedChipRemoveAriaLabel = computed<string>(
    () => this.chipRemoveAriaLabel() ?? this.config.ariaLabels().chipRemove,
  );
  /**
   * @internal Accessible name of a chip's remove button: the remove action and
   * the chip label placed by the `chipRemoveFor` message.
   */
  protected readonly chipRemoveLabelFor = computed<(label: string) => string>(() => {
    const action = this.resolvedChipRemoveAriaLabel();
    const format = this.config.ariaLabels().chipRemoveFor;
    return (label) => format(action, label);
  });
  /** Shows the first-load indicator in the panel while no `state` is bound. */
  readonly loading = input<boolean>(false);
  /**
   * First-load indicator: skeleton, spinner, bar or text. A projected
   * `*cngxSelectLoading` wins; defaults to `CngxSelectConfig.loadingVariant`.
   */
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);
  /**
   * Number of skeleton rows while `loadingVariant` is `'skeleton'`. Defaults to
   * `CngxSelectConfig.skeletonRowCount`.
   */
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);
  /**
   * Indicator over the visible options during a reload: bar, spinner, dots or
   * none. A projected `*cngxSelectRefreshing` wins; defaults to
   * `CngxSelectConfig.refreshingVariant`.
   */
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);
  /**
   * Async-state source for the tree nodes. When bound, its data replaces
   * `nodes` and its status drives the loading, empty, error and refreshing
   * views.
   */
  readonly state = input<CngxAsyncState<readonly CngxTreeNode<T>[]> | null>(null);
  /** Callback the built-in retry button runs after a failed load, before `retry` emits. */
  readonly retryFn = input<(() => void) | null>(null);
  /**
   * Async write handler run on every toggle, clear and chip removal with the
   * intended values. Unset, the change applies directly; `commitMode` decides
   * how it shows while the handler runs.
   */
  readonly commitAction = input<CngxSelectCommitAction<T[]> | null>(null);
  /**
   * Value write while `commitAction` runs. `'optimistic'` (default) applies the
   * change at once and rolls it back on error; `'pessimistic'` holds it behind
   * a row spinner until the commit succeeds. The panel stays open in both
   * modes.
   */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');
  /**
   * Panel presentation. Unset follows `CNGX_SELECT_CONFIG.mobileSheet`:
   * `'auto'` opens a modal bottom sheet on coarse, narrow viewports and
   * stays anchored elsewhere. `'anchored'`, `'sheet'` and `'fullscreen'`
   * force one presentation.
   */
  readonly presentation = input<CngxPopoverPresentationRequest | undefined>(undefined);
  /**
   * Title of the mobile sheet. Unset reads the field label once per open,
   * then `[label]`, then `ariaLabels.fieldLabelFallback`.
   */
  readonly sheetLabel = input<string | undefined>(undefined);
  /**
   * Built-in surface for a failed commit when no `*cngxSelectCommitError` is
   * projected: banner, inline or none. Defaults to
   * `CngxSelectConfig.commitErrorDisplay`.
   */
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(this.config.commitErrorDisplay);
  /**
   * Turns live-region announcements of selection changes on or off. `null`
   * inherits `CngxSelectConfig.announcer.enabled`, which defaults to on.
   */
  readonly announceChanges = input<boolean | null>(null);
  /**
   * Formatter for the live-region announcement of a selection change. `null`
   * inherits `CngxSelectConfig.announcer.format`.
   */
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);
  /**
   * Commit-error announce policy for the clear-all commit. `'verbose'`
   * reads the error message into the live region; `'soft'` announces a
   * generic removal at the current selection count. Per-instance input
   * wins over `CngxSelectConfig.commitErrorAnnouncePolicy`; default
   * `{ kind: 'verbose', severity: 'assertive' }`.
   */
  readonly commitErrorAnnouncePolicy = input<CngxCommitErrorAnnouncePolicy>(
    this.config.commitErrorAnnouncePolicy ?? { kind: 'verbose', severity: 'assertive' },
  );

  /**
   * Emits after a toggle, cascade toggle or clear settles, with the new and
   * previous values, the added and removed values and the toggled node. With
   * `commitAction` bound it fires on commit success.
   */
  readonly selectionChange = output<CngxTreeSelectChange<T>>();
  /** Emits `true` when the panel opens and `false` when it closes. */
  readonly openedChange = output<boolean>();
  /** Emits when the panel opens. */
  readonly opened = output<void>();
  /** Emits when the panel closes. */
  readonly closed = output<void>();
  /** Emits when the clear button empties the selection, together with `selectionChange`. */
  readonly cleared = output<void>();
  /**
   * Emits when the built-in retry button is pressed after a failed load, after
   * `retryFn` has run.
   */
  readonly retry = output<void>();
  /**
   * Emits the error when `commitAction` fails; optimistic mode restores the
   * previous values. The error is also announced assertively by default;
   * `commitErrorAnnouncePolicy` changes that.
   */
  readonly commitError = output<unknown>();
  /** Emits each status of a `commitAction` run: `'pending'`, then `'success'` or `'error'`. */
  readonly stateChange = output<AsyncStatus>();

  private readonly placeholderDir = contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  private readonly caretDir = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly clearButtonDir = contentChild<CngxSelectClearButton>(CngxSelectClearButton);
  private readonly emptyDir = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDir = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly loadingGlyphDir =
    contentChild<CngxSelectLoadingGlyph>(CngxSelectLoadingGlyph);
  private readonly errorDir = contentChild<CngxSelectError>(CngxSelectError);
  private readonly retryButtonDir = contentChild<CngxSelectRetryButton>(CngxSelectRetryButton);
  private readonly refreshingDir = contentChild<CngxSelectRefreshing>(CngxSelectRefreshing);
  private readonly commitErrorDir = contentChild<CngxSelectCommitError<T>>(CngxSelectCommitError);
  private readonly sheetHandleDir = contentChild(CngxSelectSheetHandle);
  private readonly sheetCountDir = contentChild(CngxSelectSheetCount);

  private readonly nodeDir = contentChild<CngxTreeSelectNode<T>>(CngxTreeSelectNode);
  private readonly chipDir = contentChild<CngxTreeSelectChip<T>>(CngxTreeSelectChip);
  private readonly nodeCountDir = contentChild<CngxTreeSelectNodeCount<T>>(CngxTreeSelectNodeCount);
  /** @internal - `*cngxTreeSelectNodeCount`, else `CNGX_SELECT_CONFIG.templates.treeNodeCount`. */
  readonly nodeCountTpl = injectResolvedTemplate<CngxTreeSelectNodeCountContext<T>>(
    this.nodeCountDir,
    'treeNodeCount',
  );
  private readonly footerDir = contentChild(CngxTreeSelectFooter);
  /** @internal - `*cngxTreeSelectFooter`, else `CNGX_SELECT_CONFIG.templates.treeFooter`. */
  readonly footerTpl = injectResolvedTemplate<CngxTreeSelectFooterContext>(
    this.footerDir,
    'treeFooter',
  );
  private readonly chipOverflowDir = contentChild<CngxSelectChipOverflow<T>>(CngxSelectChipOverflow);
  /** @internal - directive-only like the family's other chip-strip slots. */
  protected readonly chipOverflowTpl = computed<TemplateRef<
    CngxSelectChipOverflowContext<T>
  > | null>(() => this.chipOverflowDir()?.templateRef ?? null);
  private readonly triggerLabelDir = contentChild<CngxTreeSelectTriggerLabel<T>>(
    CngxTreeSelectTriggerLabel,
  );

  /**
   * Template registry for the slots the tree renders. Drives the
   * `*cngxSelect*` cascade (instance contentChild ->
   * `CNGX_SELECT_CONFIG.templates.*` -> null). The option-loop keys are
   * omitted, so they resolve to `null` here.
   *
   * @internal
   */
  protected readonly tplRegistry = inject(CNGX_TEMPLATE_REGISTRY_FACTORY)<T>({
    caret: this.caretDir,
    placeholder: this.placeholderDir,
    empty: this.emptyDir,
    loading: this.loadingDir,
    loadingGlyph: this.loadingGlyphDir,
    error: this.errorDir,
    retryButton: this.retryButtonDir,
    refreshing: this.refreshingDir,
    commitError: this.commitErrorDir,
    clearButton: this.clearButtonDir,
    sheetHandle: this.sheetHandleDir,
    sheetCount: this.sheetCountDir,
  });

  /** @internal */
  readonly placeholderTpl = this.tplRegistry.placeholder;
  /** @internal */
  readonly caretTpl = this.tplRegistry.caret;
  /** @internal */
  readonly clearButtonTpl = this.tplRegistry.clearButton;
  /** @internal - exposed for the shell's inline-error branch. */
  readonly errorTpl = this.tplRegistry.error;
  /** @internal - projected via `*cngxSelectRetryButton`. */
  readonly retryButtonTpl = this.tplRegistry.retryButton;
  /** @internal */
  readonly commitErrorTpl = this.tplRegistry.commitError;
  /** @internal */
  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<T>> | null> = computed(
    () => this.nodeDir()?.templateRef ?? null,
  );
  /** @internal - per-chip override in the trigger strip. */
  protected readonly chipTpl = computed<TemplateRef<CngxTreeSelectChipContext<T>> | null>(
    () => this.chipDir()?.templateRef ?? null,
  );
  /** @internal - whole-strip override in the trigger. Mutually exclusive with chipTpl. */
  protected readonly triggerLabelTpl = computed<TemplateRef<
    CngxTreeSelectTriggerLabelContext<T>
  > | null>(() => this.triggerLabelDir()?.templateRef ?? null);

  private readonly triggerBtn = viewChild<ElementRef<HTMLElement>>('triggerBtn');
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);
  private readonly sheetRef = viewChild(CngxPopoverSheet);

  /**
   * Tree controller. Lambdas wrap each input read so the controller
   * sees the *current* signal value on every call - required inputs
   * like `nodeIdFn` aren't resolved at factory time.
   */
  readonly treeController: CngxTreeController<T> = inject(CNGX_TREE_CONTROLLER_FACTORY)<T>({
    nodes: this.nodes,
    nodeIdFn: (v, path) => `${this.nodeIdPrefix}-${this.nodeIdFn()(v, path)}`,
    labelFn: (v) => (this.labelFn() ?? ((x: T) => String(x)))(v),
    keyFn: (v) => (this.keyFn() ?? ((x: T) => x as unknown))(v),
  });

  /**
   * Selection engine seeded with `childrenFn` so
   * `isIndeterminate(value)` is free. Drives cascade-toggle and the
   * panel's `aria-checked` (true / false / `mixed`).
   */
  private readonly selection: SelectionController<T> = inject(CNGX_SELECTION_CONTROLLER_FACTORY)<T>(
    this.values,
    {
      keyFn: (v) => (this.keyFn() ?? ((x: T) => x as unknown))(v),
      childrenFn: (v: T) => this.treeController.childrenOfValue(v),
    },
  );

  /** @internal */ readonly panelOpen = computed<boolean>(
    () => this.popoverRef()?.isVisible() ?? false,
  );
  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  /**
   * Family-shared signal graph. The tree's option source is its flat node
   * list (a `FlatTreeNode` carries `value` / `label` / `disabled` and no
   * `children`), `[state]` reaches it through a typed view, and the
   * selection controller stays the tree's own `childrenFn`-seeded one (no
   * `multiValues`). The indicator deps are inert: the tree row draws its
   * own checkbox.
   *
   * @internal
   */
  private readonly core: CngxSelectCore<T, T[]> = createSelectCore<T, T[]>(
    {
      label: this.label,
      ariaLabel: this.ariaLabel,
      ariaLabelledBy: this.ariaLabelledBy,
      placeholder: this.placeholder,
      idInput: this.idInput,
      disabledInput: this.disabledInput,
      requiredInput: this.requiredInput,
      tabIndex: this.tabIndex,
      options: this.treeController.flatNodes,
      state: createOptionsStateView<T>(this.state, this.treeController.flatNodes),
      loading: this.loading,
      compareWith: this.compareWith,
      skeletonRowCount: this.skeletonRowCount,
      panelClass: this.panelClass,
      panelWidth: this.panelWidth,
      hideSelectionIndicator: computed(() => false),
      hideCaret: this.hideCaret,
      commitErrorDisplay: this.commitErrorDisplay,
      commitAction: this.commitAction,
      errorState: this.errorState,
      multi: computed(() => true),
      currentSelection: this.values,
      selectionIndicatorPosition: computed(() => null),
      selectionIndicatorVariant: computed(() => null),
      presentationInput: this.presentation,
      // Lazy: the wiring is built from the core further down.
      presentation: computed<CngxPopoverPresentation>(() => this.sheetWiring.presentation()),
    },
    {
      announceChanges: this.announceChanges,
      announceTemplate: this.announceTemplate,
    },
  );

  /** Shared live-region announcer. */
  private readonly announcer = inject(CngxSelectAnnouncer);

  private readonly announceCommitError = inject(CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY)({
    deps: {
      announcer: this.announcer,
      commitErrorMessage: (err) => this.core.commitErrorMessage(err),
      softAnnounce: (_opt, action) => this.core.announce(null, action, this.values().length, true),
    },
    policy: this.commitErrorAnnouncePolicy,
  });

  private readonly commitHandler: ArrayCommitHandler<T> = createArrayCommitHandler<T>({
    values: this.values,
    compareWith: this.compareWith,
    commitMode: this.commitMode,
    core: this.core,
    commitAction: this.commitAction,
    getLastCommitted: () => this.dispatch.lastCommitted(),
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
    announceError: (err) => this.announceCommitError(err),
  });

  /**
   * Toggle / cascade / remove / clear mutations with their commit paths. A
   * toggle Retry replays through it (cascade meta included); a clear goes
   * back to the array handler, which owns that path.
   */
  private readonly dispatch: TreeToggleDispatch<T> = createTreeToggleDispatch<T>({
    values: this.values,
    membersEqual: (a, b) => this.membersEqual(a, b),
    compareWith: this.compareWith,
    treeController: this.treeController,
    commitAction: this.commitAction,
    commitMode: this.commitMode,
    core: this.core,
    commitHandler: () => this.commitHandler,
    emitChange: (change) => this.emitChange(change),
    emitCleared: () => this.cleared.emit(),
    emitState: (status) => this.stateChange.emit(status),
    emitCommitError: (err) => this.commitError.emit(err),
    announceCommitError: (err) => this.announceCommitError(err),
  });

  /** @internal */ readonly activeView = this.core.activeView;
  /** @internal */ readonly showRefreshIndicator = this.core.showRefreshIndicator;
  /** @internal */ readonly showInlineError = this.core.showInlineError;
  /** @internal */ readonly skeletonIndices = this.core.skeletonIndices;
  /** @internal */ readonly resolvedId = this.core.resolvedId;
  /** @internal Accessible name of the `role="tree"` panel body. */
  readonly resolvedListboxLabel = this.core.resolvedListboxLabel;
  /** @internal */
  protected readonly resolvedPlaceholder = this.core.resolvedPlaceholder;
  /** @internal The tree's active descendant matches values like the selection does. */
  readonly adCompareWith = computed<(a: T, b: T) => boolean>(() => {
    const keyFn = this.keyFn();
    const eq = this.compareWith();
    return keyFn ? (a: T, b: T) => keyFn(a) === keyFn(b) : (a: T, b: T) => eq(a, b);
  });
  /** @internal - own template only; outer popover panel class binding. */
  protected readonly panelClassList = this.core.panelClassList;
  /** @internal - own template only; outer popover panel width binding. */
  protected readonly panelWidthCss = this.core.panelWidthCss;
  /** @internal */
  readonly ariaReadonly = this.core.ariaReadonly;

  /**
   * DI-resolved focus state. Same override surface as the rest of the
   * family (telemetry / controlled-from-outside / test doubles).
   */
  private readonly focusState = inject(CNGX_TRIGGER_FOCUS_FACTORY)();
  /** @internal Field-facing focus and touched: focus inside the host, panel included. */
  protected readonly hostFocus = createHostFocusWithin({
    onLeave: () => this.presenter?.fieldState().markAsTouched(),
    // Closure: the sheet wiring is declared further down in field order.
    close: () => this.sheetWiring.handleFocusLeave(),
    owner: () => this.triggerBtn()?.nativeElement,
    restoreFocus: this.config.restoreFocus,
    suppressOpenOnFocus: (active) => {
      this.suppressOpenOnFocus = active;
    },
  });

  /** @internal Trigger ARIA projection, structural-equal; from the shared core. */
  protected readonly triggerAria = this.core.triggerAria;
  /** @internal */ protected readonly commitErrorId = this.core.commitErrorId;
  /** @internal */ readonly listboxId = this.core.listboxId;
  /** @internal */ protected readonly commitErrorText = this.core.commitErrorText;

  /** @internal */ readonly effectiveTabIndex = this.core.effectiveTabIndex;

  readonly id = computed<string>(() => this.core.resolvedId() ?? '');
  readonly focused: Signal<boolean> = this.hostFocus.focusedWithin;
  readonly empty = computed<boolean>(() => this.isEmpty());
  readonly disabled = this.core.disabled;

  /** @internal - panel-shell fallback labels (i18n). */
  readonly fallbackLabels = this.core.fallbackLabels;
  readonly ariaLabels = this.core.ariaLabels;

  /**
   * Stable retry closure bound once so the `errorContext` computed
   * stays reference-stable; only `error` / `$implicit` vary.
   */
  private readonly errorRetryBound: () => void = () => this.handleRetry();

  /** @internal */
  readonly errorContext = this.core.makeErrorContext(this.errorRetryBound);

  // Stable retry closure - recreating per CD cycle churns
  // `*ngTemplateOutlet` consumers of the commit-error context.
  private readonly commitRetryBound: () => void = () => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.dispatch.retryLast();
  };

  /** @internal */
  readonly commitErrorContext = this.core.bindCommitRetry(this.commitRetryBound);

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
    // No inline action slot today (an action tree-select would be its own
    // composite). Shell falls back when null, so a stray
    // `*cngxSelectAction` projection at this level is silently suppressed.
    action: signal<null>(null),
  };

  /** @internal */
  readonly showCommitError = this.core.showCommitError;

  /** @internal */
  isSelected(value: T): boolean {
    return this.selection.isSelected(value)();
  }
  /** @internal */
  isIndeterminate(value: T): boolean {
    return this.selection.isIndeterminate(value)();
  }
  /** @internal */
  handleRetry(): void {
    this.hostFocus.refocusOwnerBeforeRemoval();
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
  readonly isCommitting = this.core.isCommitting;
  /** Read-only commit lifecycle view (bridged via `CNGX_STATEFUL`). */
  readonly commitState = this.core.commitState;

  /** @internal Mobile sheet presentation; also the scoped announcer's scope. */
  readonly sheetWiring: CngxSelectSheetWiring = createSelectSheetWiring({
    popupRole: 'tree',
    core: this.core,
    sheet: this.sheetRef,
    popoverRef: this.popoverRef,
    listboxRef: signal(undefined),
    tpl: this.tplRegistry,
    // Lazy: the count is declared further down in field order.
    selectionCount: computed(() => this.selectionCountText()),
    commitMode: this.commitMode,
    dismissOn: this.config.dismissOn,
    showDone: true,
    showInput: false,
    sheetLabel: this.sheetLabel,
    label: this.label,
    close: () => this.close(),
  });
  /** @internal Static height fact: a content-sized sheet. */
  protected readonly sheetFill = 'sheet';

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

  /** @internal Chip list for the resolved `chipDisplay` mode. */
  private readonly chipView = createTreeChipDisplay<T>({
    selected: this.selected,
    mode: this.resolvedChipDisplay,
    treeController: this.treeController,
  });
  /** @internal */
  protected readonly displayedChips = this.chipView.displayed;

  /** Per-parent selected-of-total, one pass per change. */
  private readonly counts = createTreeSelectionCounts<T>({
    flatNodes: this.treeController.flatNodes,
    values: this.values,
    findByValue: (value) => this.treeController.findByValue(value),
  });

  /** @internal Number of selected values (the count the announcer speaks). */
  readonly selectionCount = computed(() => this.values().length);
  /** @internal */
  readonly selectionCountText = computed(() =>
    this.fallbackLabels().selectedCount(this.selectionCount()),
  );
  /** @internal Footer clear-all label, the trigger clear-button cascade. */
  readonly clearAllLabel = computed(() => this.resolvedClearButtonAriaLabel());

  /** @internal Clear from the panel footer; focus stays in the panel. */
  clearAllInPanel(): void {
    this.dispatch.clearAll();
  }

  /** @internal */
  nodeCount(node: FlatTreeNode<T>): { readonly selected: number; readonly total: number } | null {
    return this.counts().get(node.id) ?? null;
  }

  /** @internal */
  nodeCountText(node: FlatTreeNode<T>): string {
    const count = this.counts().get(node.id);
    return count ? this.fallbackLabels().treeNodeCount(count.selected, count.total) : '';
  }

  /**
   * @internal - one-line summary instead of chips under the touch floor,
   * counted over the same displayed list the chips render.
   */
  protected readonly summary = createSelectSummary<T>({
    selectedOptions: computed(() => [...this.displayedChips()]),
    active: injectTouchFloorSignal(),
    // One line on every pointer: the strip always truncates.
    chipOverflow: TRUNCATE,
    maxVisibleChips: this.maxVisibleChips,
    ariaLabels: this.config.ariaLabels,
    fallbackLabels: this.config.fallbackLabels,
  });

  /** @internal - the touch floor; the panel's row tap expands under it. */
  readonly rowTapExpands = this.summary.active;
  private readonly chipStrip = this.summary.strip;
  /** @internal - displayed chips up to the cap. */
  protected readonly visibleSelected = this.chipStrip.visibleSelected;
  /** @internal */
  protected readonly overflowBadgeCount = this.chipStrip.overflowBadgeCount;
  /** @internal Displayed chips behind the `+N` chip, for the overflow slot. */
  protected readonly hiddenSelected = this.chipStrip.hiddenSelected;
  /** @internal Visible `+N` text, the count in the reading locale's digits. */
  protected readonly overflowBadgeText = computed<string>(() =>
    this.config.fallbackLabels().chipOverflowBadge(this.overflowBadgeCount()),
  );

  /**
   * Opens the panel. On a disabled control the panel closes again at once, so
   * the call has no effect.
   */
  open(): void {
    this.popoverRef()?.show();
  }
  /**
   * Closes the panel. With `CngxSelectConfig.restoreFocus` on, focus moves back
   * to the trigger first.
   */
  close(): void {
    this.hostFocus.refocusOwnerBeforeClose();
    this.popoverRef()?.hide();
  }
  /**
   * Opens the panel when it is closed and closes it when it is open. On a
   * disabled control an open is undone at once, as with `open()`.
   */
  toggle(): void {
    this.popoverRef()?.toggle();
  }
  /** Moves focus to the trigger, passing the given `FocusOptions` through. */
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
        // Raw nodeIdFn ids in, instance-prefixed controller ids out.
        for (const id of init as readonly string[]) {
          this.treeController.expand(`${this.nodeIdPrefix}-${id}`);
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
      restoringFocus: (active) => {
        this.suppressOpenOnFocus = active;
      },
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
      this.dispatch.cascadeToggle(node);
      return;
    }
    this.dispatch.singleToggle(node);
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
    // Never hijack browser/app shortcuts: Ctrl/Cmd/Alt combos pass through
    // untouched - the same guard the nav strategies and CngxListboxTrigger
    // apply. Shift stays allowed.
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    // Keys from a chip remove button belong to that button: no
    // preventDefault, so Enter / Space run its native activation.
    const host = event.currentTarget as Element | null;
    const target = event.target as Element | null;
    const interactive = target?.closest('button, a[href], input, [role="button"]');
    if (interactive && interactive !== host) {
      return;
    }
    if (this.disabled()) {
      return;
    }
    const key = event.key;
    if (this.panelOpen()) {
      if (key === 'Escape' && this.sheetWiring.escapeEnabled()) {
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

  /** @internal - click-outside dismissal (no action bridge on tree-select). */
  protected readonly handleClickOutside = this.sheetWiring.handleClickOutside;

  /** @internal */
  protected handleChipRemoveClick(event: Event, opt: CngxTreeSelectedItem<T>): void {
    event.stopPropagation();
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.removeSelectedItem(opt);
  }

  /**
   * Chip-removal handler. Uses `removeOverride` so the factory absorbs
   * the disabled-guard + WeakMap closure cache while the override
   * keeps the tree-aware mutation path:
   *
   *   - chip that summarizes a fully selected subtree (`chipDisplay`
   *     `'parents'`) → cascade deselect of that subtree (disabled
   *     descendants keep their state).
   *   - any other in-tree value → single toggle (single deselect).
   *   - stale value (not in tree) → strip from `values` + emit +
   *     announce.
   *
   * Standard sync/commit branches are bypassed because the tree toggle
   * dispatch owns commit-action, optimistic write, and rollback for the
   * tree world.
   */
  private readonly chipRemovalHandler: CngxChipRemovalHandler<CngxTreeSelectedItem<T>> = inject(
    CNGX_CHIP_REMOVAL_HANDLER_FACTORY,
  )<T, CngxTreeSelectedItem<T>>({
    disabled: this.disabled,
    removeOverride: (item) => this.removeSelectedItem(item),
  });

  /** @internal - stable remove callback for `*cngxTreeSelectChip` context. */
  protected chipRemoveFor(opt: CngxTreeSelectedItem<T>): () => void {
    return this.hostFocus.withRefocus(this.chipRemovalHandler.removeFor(opt));
  }

  /**
   * Shared removal path for chip × and the `remove` callback in
   * `*cngxTreeSelectChip`. A summarizing parent chip stands for its whole
   * subtree, so it cascades; every other chip removes its one value.
   *
   * Disabled-guard lives in the handler; this method assumes safe.
   */
  private removeSelectedItem(opt: CngxTreeSelectedItem<T>): void {
    const node = this.chipView.summarizes(opt.value)
      ? this.treeController.findByValue(opt.value)
      : undefined;
    if (node) {
      this.dispatch.cascadeToggle(node);
      return;
    }
    this.dispatch.removeValue(opt.value, opt.label);
  }

  /** @internal - exposed for the `*cngxSelectClearButton` slot. */
  protected readonly clearAll: () => void = () => {
    this.hostFocus.refocusOwnerBeforeRemoval();
    this.dispatch.clearAll();
  };

  /** @internal */
  protected handleClearAllClick(event: Event): void {
    event.stopPropagation();
    this.clearAll();
  }

  /** @internal */
  // True only inside the lifecycle emitter's post-close focus restore -
  // the programmatic refocus must not re-open under openOn: 'focus'.
  private suppressOpenOnFocus = false;

  protected handleFocus(): void {
    this.focusState.markFocused();
    const openOnFocus =
      this.config.openOn === 'focus' || this.config.openOn === 'click+focus';
    if (openOnFocus && !this.suppressOpenOnFocus) {
      this.open();
    }
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusState.markBlurred();
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

  private emitChange(change: Omit<CngxTreeSelectChange<T>, 'source'>): void {
    this.selectionChange.emit({ ...change, source: this });
  }
}
