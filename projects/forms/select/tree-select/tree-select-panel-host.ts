import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';
import { type CngxTreeController } from '@cngx/common/interactive';
import { type FlatTreeNode } from '@cngx/utils';
import type {
  CngxTreeSelectFooterContext,
  CngxTreeSelectNodeContext,
  CngxTreeSelectNodeCountContext,
} from './tree-select.model';

/**
 * Minimal surface the tree-body panel needs from `CngxTreeSelect`.
 * The token decouples the panel file from the concrete class
 * (avoiding a cyclic type dependency) and makes refactors surface on
 * this interface first.
 *
 * Loading / empty / error / refreshing / commit-error surfaces flow
 * through `CNGX_SELECT_PANEL_HOST` instead. `CngxTreeSelect` provides
 * both tokens (`useExisting: self`); the interfaces are split so the
 * shell stays value-shape-agnostic.
 *
 * @internal
 */
export interface CngxTreeSelectPanelHost<T = unknown> {
  /** Tree controller. Owns expansion state and indexes. */
  readonly treeController: CngxTreeController<T>;
  /**
   * Whether the enclosing popover is visible. Panel observes it to
   * transfer focus into the tree on open and to skip idle work while
   * closed.
   */
  readonly panelOpen: Signal<boolean>;
  /** A disabled select drops every activation. */
  readonly disabled: Signal<boolean>;
  /** Id of the `role="tree"` container; the trigger's `aria-controls` names it. */
  readonly listboxId: string;
  /**
   * Opt-in expand-to-reveal type-to-find. When `true` the panel
   * resolves typeahead misses against the full flat tree (reveal +
   * re-highlight); when `false` a miss is a no-op.
   */
  readonly expandToReveal: Signal<boolean>;
  /** Resolved `*cngxTreeSelectNode` template (or `null`). */
  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<T>> | null>;
  /**
   * Glyph overrides for the default node row. Only consulted when no
   * `*cngxTreeSelectNode` is projected.
   */
  readonly twistyGlyph: Signal<TemplateRef<void> | null>;
  readonly twistyOpenGlyph: Signal<TemplateRef<void> | null>;
  readonly checkGlyph: Signal<TemplateRef<void> | null>;
  readonly dashGlyph: Signal<TemplateRef<void> | null>;
  /**
   * Accessible name of the `role="tree"` body: `[label]`, else
   * `aria-label`, else the placeholder, else the `listboxFallback` copy.
   * Same cascade as the flat family's listbox name.
   */
  readonly resolvedListboxLabel: Signal<string>;
  /**
   * Value equality the tree's active descendant uses to find the highlighted
   * node again after the nodes change (`keyFn`, else `compareWith`).
   */
  readonly adCompareWith: Signal<(a: T, b: T) => boolean>;
  /** Resolved `*cngxTreeSelectNodeCount` template (instance, then config), or `null`. */
  readonly nodeCountTpl: Signal<TemplateRef<CngxTreeSelectNodeCountContext<T>> | null>;
  /** Selected and total descendants of a parent node; `null` for a leaf. */
  nodeCount(node: FlatTreeNode<T>): { readonly selected: number; readonly total: number } | null;
  /** The `treeNodeCount` copy for a parent node; `''` for a leaf. */
  nodeCountText(node: FlatTreeNode<T>): string;
  /** Number of selected values. */
  readonly selectionCount: Signal<number>;
  /** The `selectedCount` copy for `selectionCount`. */
  readonly selectionCountText: Signal<string>;
  /** Visible label of the footer clear-all (the clear-button copy cascade). */
  readonly clearAllLabel: Signal<string>;
  /** Resolved `*cngxTreeSelectFooter` template (instance, then config), or `null`. */
  readonly footerTpl: Signal<TemplateRef<CngxTreeSelectFooterContext> | null>;
  /** Clear the selection from inside the panel; focus stays in the panel. */
  clearAllInPanel(): void;
  /** Whether the value is selected. */
  isSelected(value: T): boolean;
  /** Whether the value is partially selected via cascade descendants. */
  isIndeterminate(value: T): boolean;
  /**
   * Select-path dispatch - click, Enter/Space via AD, or
   * `handleSelect()` from a consumer template. Routes through
   * cascade + commit.
   */
  handleSelect(node: FlatTreeNode<T>): void;
  /** Close the popover (Escape inside the panel). */
  close(): void;
}

/**
 * Injection token for the tree-panel host contract.
 * `CngxTreeSelect` provides `{ useExisting: self }` alongside the
 * flat `CNGX_SELECT_PANEL_HOST` so the shell still sees the shared
 * panel-view surface.
 *
 * @internal
 */
export const CNGX_TREE_SELECT_PANEL_HOST = new InjectionToken<
  CngxTreeSelectPanelHost<unknown>
>('CNGX_TREE_SELECT_PANEL_HOST');
