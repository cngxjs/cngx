import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
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
        role="tree"
        aria-multiselectable="true"
        cngxActiveDescendant
        #ad="cngxActiveDescendant"
        [items]="adItems()"
        [cngxHierarchicalNav]="host.treeController"
        (keydown.enter)="handleActivate($event, ad)"
        (keydown.space)="handleActivate($event, ad)"
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

  /**
   * Passthrough of visible-nodes into the AD's item shape. Built via
   * the decoupled `createTreeAdItems` helper so the controller stays
   * a11y-agnostic. Re-computed automatically when the controller's
   * `visibleNodes` emits.
   */
  protected readonly adItems = createTreeAdItems(this.host.treeController);

  /**
   * Cached `node.id → toggleExpand` and `node.id → handleSelect`
   * closures for the slot context. Built once per panel instance so
   * passing the context into `ngTemplateOutlet` doesn't thrash the
   * slot template's input-identity on every re-derivation of the
   * visible node list.
   *
   * Context objects themselves stay fresh per @for iteration — the
   * template outlet re-binds them, but the closures inside are stable.
   */
  private readonly toggleById = new Map<string, () => void>();
  private readonly selectByValue = new WeakMap<object, () => void>();

  protected nodeContext(node: FlatTreeNode<T>): CngxTreeSelectNodeContext<T> {
    const toggleExpand = this.getToggleExpand(node.id);
    const handleSelect = this.getHandleSelect(node);
    return {
      $implicit: node,
      node,
      depth: node.depth,
      expanded: this.host.treeController.isExpanded(node.id)(),
      hasChildren: node.hasChildren,
      selected: this.host.isSelected(node.value),
      indeterminate: this.host.isIndeterminate(node.value),
      disabled: node.disabled,
      toggleExpand,
      handleSelect,
    };
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

  /**
   * Cached memoization hook used by the @for template — exposes the
   * controller's visible-nodes signal for the `track` expression
   * without forcing the template to chain method calls. Not strictly
   * required but keeps the template tight.
   */
  protected readonly visibleNodes = computed(() =>
    this.host.treeController.visibleNodes(),
  );
}
