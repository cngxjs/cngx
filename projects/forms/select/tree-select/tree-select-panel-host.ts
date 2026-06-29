import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';
import { type CngxTreeController } from '@cngx/common/interactive';
import { type FlatTreeNode } from '@cngx/utils';
import type { CngxTreeSelectNodeContext } from './tree-select.model';

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
  /** Localised aria-labels for the twisty button. */
  readonly twistyExpandLabel: Signal<string>;
  readonly twistyCollapseLabel: Signal<string>;
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
