import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  untracked,
  viewChild,
  type ElementRef,
} from '@angular/core';
import { CngxActiveDescendant } from '@cngx/common/a11y';
import {
  CngxHierarchicalNav,
  createTreeAdItems,
} from '@cngx/common/interactive';
import { CngxCheckboxIndicator } from '@cngx/common/display';
import type { FlatTreeNode } from '@cngx/utils';

import { CngxSelectPanelShell } from '../shared/panel-shell/panel-shell.component';
import {
  CNGX_TREE_SELECT_PANEL_HOST,
  type CngxTreeSelectPanelHost,
} from './tree-select-panel-host';
import type { CngxTreeSelectNodeContext } from './tree-select.model';

/**
 * Tree-body sibling of `CngxSelectPanel`. Wraps the shared
 * `CngxSelectPanelShell` (loading / empty / error / refreshing /
 * commit-error scaffold) and projects a `role="tree"` container into
 * its content slot. The container composes `CngxActiveDescendant` for
 * vertical nav + typeahead + Home/End and `CngxHierarchicalNav` for
 * ArrowLeft/Right expand-collapse-and-traverse.
 *
 * Per-node rendering defaults to a twisty + checkbox-indicator + label
 * row; a consumer-projected `*cngxTreeSelectNode` template wins when
 * present. Either path receives the full `CngxTreeSelectNodeContext<T>`
 * — the same closed `toggleExpand` / `handleSelect` callbacks so custom
 * markup participates in cascade / commit / announce without
 * re-plumbing.
 *
 * W3C Treeview APG attributes are all in the reactive graph:
 * `aria-expanded` reads `treeController.isExpanded(id)()`,
 * `aria-selected` reads `host.isSelected(value)`, `aria-level` /
 * `-posinset` / `-setsize` come straight from the `FlatTreeNode`
 * projection. Nothing is set once and forgotten.
 *
 * @internal
 */
@Component({
  selector: 'cngx-tree-select-panel',
  exportAs: 'cngxTreeSelectPanel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxActiveDescendant,
    CngxCheckboxIndicator,
    CngxHierarchicalNav,
    CngxSelectPanelShell,
    NgTemplateOutlet,
  ],
  host: {
    class: 'cngx-tree-select-panel-host',
  },
  template: `
    <cngx-select-panel-shell>
      <div
        #treeContainer
        role="tree"
        aria-multiselectable="true"
        cngxActiveDescendant
        #ad="cngxActiveDescendant"
        [items]="adItems()"
        [autoHighlightFirst]="true"
        [cngxHierarchicalNav]="host.treeController"
        (keydown.enter)="handleActivate($event, ad)"
        (keydown.space)="handleActivate($event, ad)"
        (keydown.escape)="handleEscape($event)"
        tabindex="0"
        class="cngx-tree-select__tree"
      >
        @for (node of host.treeController.visibleNodes(); track node.id) {
          @if (host.nodeTpl(); as slot) {
            <ng-container
              *ngTemplateOutlet="slot; context: nodeContext(node)"
            />
          } @else {
            <div
              role="treeitem"
              [attr.id]="node.id"
              [attr.aria-level]="node.depth + 1"
              [attr.aria-posinset]="node.posinset"
              [attr.aria-setsize]="node.setsize"
              [attr.aria-expanded]="
                node.hasChildren
                  ? host.treeController.isExpanded(node.id)()
                  : null
              "
              [attr.aria-selected]="host.isSelected(node.value)"
              [attr.aria-disabled]="node.disabled ? 'true' : null"
              [style.--cngx-tree-depth]="node.depth"
              class="cngx-tree-select__node"
              (click)="!node.disabled && host.handleSelect(node)"
            >
              @if (node.hasChildren) {
                <button
                  type="button"
                  class="cngx-tree-select__twisty"
                  [class.cngx-tree-select__twisty--open]="
                    host.treeController.isExpanded(node.id)()
                  "
                  tabindex="-1"
                  [attr.aria-label]="
                    host.treeController.isExpanded(node.id)()
                      ? 'Collapse'
                      : 'Expand'
                  "
                  (click)="toggleExpand($event, node)"
                >▸</button>
              } @else {
                <span aria-hidden="true" class="cngx-tree-select__twisty-spacer"></span>
              }
              <cngx-checkbox-indicator
                [checked]="host.isSelected(node.value)"
                [indeterminate]="host.isIndeterminate(node.value)"
              />
              <span class="cngx-tree-select__label">{{ node.label }}</span>
            </div>
          }
        }
      </div>
    </cngx-select-panel-shell>
  `,
  styleUrls: ['../shared/select-base.css', './tree-select-panel.component.css'],
})
export class CngxTreeSelectPanel<T = unknown> {
  protected readonly host = inject(
    CNGX_TREE_SELECT_PANEL_HOST,
  ) as CngxTreeSelectPanelHost<T>;

  private readonly treeContainer = viewChild<ElementRef<HTMLElement>>('treeContainer');

  constructor() {
    // Focus the tree container when the popover opens. The AD directive
    // reacts to keyboard events only when its host element has DOM focus;
    // without this effect the trigger keeps focus and arrow keys don't
    // reach the tree. Transitions are observed on the host's panelOpen
    // signal and focus is wrapped in `untracked` so it stays a pure
    // imperative side effect.
    effect(() => {
      const open = this.host.panelOpen();
      if (!open) {
        return;
      }
      untracked(() => {
        queueMicrotask(() => this.treeContainer()?.nativeElement.focus());
      });
    });
  }

  /**
   * Passthrough of visible-nodes into the AD's item shape. Built via
   * the decoupled `createTreeAdItems` helper so the controller stays
   * a11y-agnostic. Re-computed automatically when the controller's
   * `visibleNodes` emits.
   */
  protected readonly adItems = createTreeAdItems(this.host.treeController);

  /**
   * Per-node memoization. Two purposes:
   *
   * - **Closure identity**: `toggleExpand` and `handleSelect` are stable
   *   across re-derivations so the slot template's outlet sees the same
   *   function references on every trigger.
   * - **Context identity**: `nodeContext(node)` returns the SAME
   *   context object when the node's reactive flags (expanded /
   *   selected / indeterminate) and the underlying `FlatTreeNode` ref
   *   haven't changed. `ngTemplateOutlet` compares context by reference
   *   and rebinds the embedded view whenever the ref changes — caching
   *   stops the outlet thrashing every change-detection cycle even for
   *   rows whose state hasn't changed.
   *
   * Entries live for the panel's lifetime; the panel is scoped to a
   * single popover open → GC picks up the whole closure on popover
   * close.
   */
  private readonly contextCache = new Map<
    string,
    {
      readonly node: FlatTreeNode<T>;
      readonly expanded: boolean;
      readonly selected: boolean;
      readonly indeterminate: boolean;
      readonly context: CngxTreeSelectNodeContext<T>;
    }
  >();
  private readonly toggleById = new Map<string, () => void>();
  private readonly selectByValue = new WeakMap<object, () => void>();

  protected nodeContext(node: FlatTreeNode<T>): CngxTreeSelectNodeContext<T> {
    const expanded = this.host.treeController.isExpanded(node.id)();
    const selected = this.host.isSelected(node.value);
    const indeterminate = this.host.isIndeterminate(node.value);

    const cached = this.contextCache.get(node.id);
    if (
      cached?.node === node &&
      cached?.expanded === expanded &&
      cached?.selected === selected &&
      cached?.indeterminate === indeterminate
    ) {
      return cached.context;
    }

    const context: CngxTreeSelectNodeContext<T> = {
      $implicit: node,
      node,
      depth: node.depth,
      expanded,
      hasChildren: node.hasChildren,
      selected,
      indeterminate,
      disabled: node.disabled,
      toggleExpand: this.getToggleExpand(node.id),
      handleSelect: this.getHandleSelect(node),
    };
    this.contextCache.set(node.id, {
      node,
      expanded,
      selected,
      indeterminate,
      context,
    });
    return context;
  }

  private getToggleExpand(id: string): () => void {
    let cached = this.toggleById.get(id);
    if (!cached) {
      cached = () => this.host.treeController.toggle(id);
      this.toggleById.set(id, cached);
    }
    return cached;
  }

  private getHandleSelect(node: FlatTreeNode<T>): () => void {
    // `node.value` may be a primitive — only cache when it's an object
    // so we honour the WeakMap contract. Primitive-valued callbacks
    // are recreated per call; cheap and correct.
    const key = (typeof node.value === 'object' && node.value !== null)
      ? (node.value as unknown as object)
      : null;
    if (key) {
      let cached = this.selectByValue.get(key);
      if (!cached) {
        cached = () => this.host.handleSelect(node);
        this.selectByValue.set(key, cached);
      }
      return cached;
    }
    return () => this.host.handleSelect(node);
  }

  protected toggleExpand(event: MouseEvent, node: FlatTreeNode<T>): void {
    event.stopPropagation();
    this.host.treeController.toggle(node.id);
  }

  protected handleActivate(event: Event, ad: CngxActiveDescendant): void {
    const item = ad.activeItem();
    if (!item) {
      return;
    }
    event.preventDefault();
    const node = this.host.treeController.findById(item.id);
    if (!node || node.disabled) {
      return;
    }
    this.host.handleSelect(node);
  }

  protected handleEscape(event: Event): void {
    event.preventDefault();
    this.host.close();
  }
}
