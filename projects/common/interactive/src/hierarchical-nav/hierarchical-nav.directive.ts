import { Directive, inject, input, output } from '@angular/core';
import { CngxActiveDescendant } from '@cngx/common/a11y';
import { type CngxTreeController } from '../tree-controller/tree-controller';
import {
  CNGX_HIERARCHICAL_NAV_STRATEGY,
  type CngxHierarchicalNavAction,
} from './hierarchical-nav-strategy';

/**
 * W3C-tree keyboard extension. Wires `ArrowRight` / `ArrowLeft` to a
 * pluggable {@link CngxHierarchicalNavStrategy}; the default strategy
 * implements the
 * [APG treeview pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/):
 *
 * - **ArrowRight** on a collapsed parent expands it. On an already-open
 *   parent it moves the active-descendant to the first child. On a leaf
 *   it is a no-op.
 * - **ArrowLeft** on an open node collapses it. On a closed node (or
 *   leaf) with a parent it moves the active-descendant to the parent.
 *   On a root leaf it is a no-op.
 *
 * Swap the strategy via `CNGX_HIERARCHICAL_NAV_STRATEGY` to customise
 * the semantics (expand-only, never-traverse, exotic drag-drop flows)
 * without forking the directive.
 *
 * Attaches on the same element as `CngxActiveDescendant`; injects the AD
 * instance (`host: true`, optional) and leaves vertical `ArrowUp`/`Down`,
 * `Home`/`End`, and typeahead to AD's own handler. The two directives
 * coexist without conflict — in vertical orientation AD's `isNavKey`
 * branches for `ArrowLeft`/`ArrowRight` are already no-ops.
 *
 * Outputs are informational and state-change-truthful: `expand` /
 * `collapse` / `movedToChild` / `movedToParent` fire only when the
 * strategy reports the corresponding action. A disabled target the
 * strategy's `attemptMove` couldn't highlight never triggers a
 * `movedToChild` / `movedToParent` emission.
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

  private readonly strategy = inject(CNGX_HIERARCHICAL_NAV_STRATEGY);

  /** Emitted with the id that was just expanded via ArrowRight. */
  readonly expand = output<string>();
  /** Emitted with the id that was just collapsed via ArrowLeft. */
  readonly collapse = output<string>();
  /** Emitted with the id of the parent the active-descendant moved to. */
  readonly movedToParent = output<string>();
  /** Emitted with the id of the child the active-descendant moved to. */
  readonly movedToChild = output<string>();

  handleRight(event: Event): void {
    this.dispatch(event, (ctx) => this.strategy.onArrowRight(ctx));
  }

  handleLeft(event: Event): void {
    this.dispatch(event, (ctx) => this.strategy.onArrowLeft(ctx));
  }

  /**
   * Shared guard + action-dispatch wrapper. Degrades silently when AD
   * isn't composed on the host or nothing is highlighted.
   */
  private dispatch(
    event: Event,
    step: (ctx: {
      readonly controller: CngxTreeController<T>;
      readonly ad: CngxActiveDescendant;
      readonly activeId: string;
    }) => CngxHierarchicalNavAction,
  ): void {
    const ad = this.ad;
    if (!ad) {
      return;
    }
    const activeId = ad.activeId();
    if (activeId === null) {
      return;
    }
    const action = step({ controller: this.controller(), ad, activeId });
    if (action.kind === 'noop') {
      return;
    }
    switch (action.kind) {
      case 'expand':
        this.expand.emit(action.id);
        break;
      case 'collapse':
        this.collapse.emit(action.id);
        break;
      case 'movedToChild':
        this.movedToChild.emit(action.id);
        break;
      case 'movedToParent':
        this.movedToParent.emit(action.id);
        break;
    }
    event.preventDefault();
  }
}
