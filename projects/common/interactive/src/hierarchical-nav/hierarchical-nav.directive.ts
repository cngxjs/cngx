import { Directive, inject, input, output } from '@angular/core';
import { CngxActiveDescendant } from '@cngx/common/a11y';
import { type CngxTreeController } from '../tree-controller/tree-controller';

/**
 * W3C-tree keyboard extension. Wires `ArrowRight` / `ArrowLeft` to the
 * expand-collapse-and-traverse semantics defined in the
 * [APG treeview pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):
 *
 * - **ArrowRight** on a collapsed parent expands it. On an already-open
 *   parent it moves the active-descendant to the first child. On a leaf
 *   it is a no-op.
 * - **ArrowLeft** on an open node collapses it. On a closed node (or
 *   leaf) with a parent it moves the active-descendant to the parent.
 *   On a root leaf it is a no-op.
 *
 * Attaches on the same element as `CngxActiveDescendant`; injects the AD
 * instance (`host: true`, optional) and leaves vertical `ArrowUp`/`Down`,
 * `Home`/`End`, and typeahead to AD's own handler. The two directives
 * coexist without conflict — in vertical orientation AD's `isNavKey`
 * branches for `ArrowLeft`/`ArrowRight` are already no-ops.
 *
 * Outputs are informational: `expand` / `collapse` / `movedToChild` /
 * `movedToParent` fire only when the corresponding state change
 * succeeded, so a disabled child that AD refuses to highlight will NOT
 * trigger a `movedToChild` emission.
 *
 * @example
 * ```html
 * <ul
 *   role="tree"
 *   aria-multiselectable="true"
 *   cngxActiveDescendant
 *   [items]="adItems()"
 *   [cngxHierarchicalNav]="treeController"
 *   tabindex="0"
 * ></ul>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxHierarchicalNav]',
  exportAs: 'cngxHierarchicalNav',
  standalone: true,
  host: {
    '(keydown.arrowleft)': 'handleLeft($event)',
    '(keydown.arrowright)': 'handleRight($event)',
  },
})
export class CngxHierarchicalNav<T = unknown> {
  /**
   * The tree controller that owns expansion state. Required — without it
   * the directive has nothing to reason about.
   */
  readonly controller = input.required<CngxTreeController<T>>({
    alias: 'cngxHierarchicalNav',
  });

  private readonly ad = inject(CngxActiveDescendant, {
    host: true,
    optional: true,
  });

  /** Emitted with the id that was just expanded via ArrowRight. */
  readonly expand = output<string>();
  /** Emitted with the id that was just collapsed via ArrowLeft. */
  readonly collapse = output<string>();
  /** Emitted with the id of the parent the active-descendant moved to. */
  readonly movedToParent = output<string>();
  /** Emitted with the id of the child the active-descendant moved to. */
  readonly movedToChild = output<string>();

  handleRight(event: Event): void {
    if (!this.ad) {
      return;
    }
    const activeId = this.ad.activeId();
    if (activeId === null) {
      return;
    }
    const ctrl = this.controller();
    const node = ctrl.findById(activeId);
    if (!node?.hasChildren) {
      return;
    }
    if (!ctrl.isExpanded(activeId)()) {
      ctrl.expand(activeId);
      this.expand.emit(activeId);
      event.preventDefault();
      return;
    }
    const firstChild = ctrl.firstChildOf(activeId);
    if (!firstChild) {
      return;
    }
    const before = this.ad.activeId();
    this.ad.highlightByValue(firstChild.value);
    if (this.ad.activeId() === before) {
      return;
    }
    this.movedToChild.emit(firstChild.id);
    event.preventDefault();
  }

  handleLeft(event: Event): void {
    if (!this.ad) {
      return;
    }
    const activeId = this.ad.activeId();
    if (activeId === null) {
      return;
    }
    const ctrl = this.controller();
    if (ctrl.isExpanded(activeId)()) {
      ctrl.collapse(activeId);
      this.collapse.emit(activeId);
      event.preventDefault();
      return;
    }
    const parent = ctrl.parentOf(activeId);
    if (!parent) {
      return;
    }
    const before = this.ad.activeId();
    this.ad.highlightByValue(parent.value);
    if (this.ad.activeId() === before) {
      return;
    }
    this.movedToParent.emit(parent.id);
    event.preventDefault();
  }
}
