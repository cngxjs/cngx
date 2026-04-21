import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';
import { type CngxTreeController } from '@cngx/common/interactive';
import { type FlatTreeNode } from '@cngx/utils';
import type { CngxTreeSelectNodeContext } from './tree-select.model';

/**
 * Minimal surface the tree-body panel needs from its `CngxTreeSelect`
 * host. Mirrors the split `CngxSelectPanelHost` introduced with
 * `CngxSelectPanel`: the token decouples the panel file from the
 * concrete `CngxTreeSelect` class (avoiding a cyclic type dependency)
 * and makes refactors on the component surface show up on this
 * interface first, not inside the tree-panel template.
 *
 * Loading / empty / error / refreshing / commit-error surfaces are
 * owned by the shared `CngxSelectPanelShell` and flow through the
 * separate `CNGX_SELECT_PANEL_HOST` token. `CngxTreeSelect` provides
 * BOTH tokens (`useExisting: self`); the interfaces are deliberately
 * split so the shell stays value-shape-agnostic.
 *
 * @internal
 */
export interface CngxTreeSelectPanelHost<T = unknown> {
  /** Signal-native tree controller. Owns expansion state + indexes. */
  readonly treeController: CngxTreeController<T>;
  /**
   * Whether the enclosing popover is visible. Panel observes it to
   * transfer focus into the tree container on open and to skip idle
   * work while closed.
   */
  readonly panelOpen: Signal<boolean>;
  /**
   * Resolved `*cngxTreeSelectNode` template (instance content-child →
   * `null` library-default). The tree component runs the
   * `injectResolvedTemplate` cascade; the panel only renders whatever
   * signal it receives.
   */
  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<T>> | null>;
  /**
   * Fine-grained glyph overrides for the default node-row. Only
   * consulted when no `*cngxTreeSelectNode` is projected — consumer
   * templates override directly. Pairs with the flat-family's
   * `clearGlyph` / `caretGlyph` pattern for minimal, no-fork glyph
   * swaps.
   */
  readonly twistyGlyph: Signal<TemplateRef<void> | null>;
  readonly twistyOpenGlyph: Signal<TemplateRef<void> | null>;
  readonly checkGlyph: Signal<TemplateRef<void> | null>;
  readonly dashGlyph: Signal<TemplateRef<void> | null>;
  /**
   * Localised aria-labels for the twisty expand/collapse button.
   * Falls back to English defaults ('Expand' / 'Collapse') when
   * unset.
   */
  readonly twistyExpandLabel: Signal<string>;
  readonly twistyCollapseLabel: Signal<string>;
  /** Whether this node's value is currently selected. */
  isSelected(value: T): boolean;
  /** Whether this node's value is partially selected via cascade descendants. */
  isIndeterminate(value: T): boolean;
  /**
   * Dispatch the select path for a node — click, Enter/Space via AD
   * activation, or `handleSelect()` invoked from a consumer template.
   * Implementation routes through cascade + commit flow inside the
   * surrounding `CngxTreeSelect`.
   */
  handleSelect(node: FlatTreeNode<T>): void;
  /** Close the enclosing popover (Escape key inside the panel). */
  close(): void;
}

/**
 * Injection token for the tree-panel's minimal host contract.
 * `CngxTreeSelect` provides `{ useExisting: self }` alongside the
 * flat `CNGX_SELECT_PANEL_HOST` token so `CngxSelectPanelShell` still
 * sees the shared panel-view surface.
 *
 * @internal
 */
export const CNGX_TREE_SELECT_PANEL_HOST = new InjectionToken<
  CngxTreeSelectPanelHost<unknown>
>('CNGX_TREE_SELECT_PANEL_HOST');
