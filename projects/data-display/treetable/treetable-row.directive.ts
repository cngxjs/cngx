import { computed, Directive, inject, input } from '@angular/core';
import { CngxHoverable } from '@cngx/common';
import type { FlatNode } from './models';

/**
 * Row directive applied to every rendered table row in `CngxTreetable`.
 * Handles depth-based CSS indentation, hover highlight, and selection
 * styling.
 *
 * Sets the `--cngx-row-depth` CSS custom property on the host element so that
 * cell padding can drive indentation via `calc()` in component stylesheets.
 * ```html
 * <div cngxTreetableRow [node]="node" [highlight]="highlight"></div>
 * ```
 * @typeParam T - The data type of the tree nodes.
 *
 * @category data-display/treetable
 */
@Directive({
  selector: '[cngxTreetableRow]',
  standalone: true,
  hostDirectives: [CngxHoverable],
  host: {
    '[style.--cngx-row-depth]': 'node().depth',
    '[class.cngx-treetable__row--highlighted]': 'highlighted()',
    '[class.cngx-treetable__row--selected]': 'selected()',
  },
})
export class CngxTreetableRow<T = unknown> {
  /** The flat node this row represents. Required. */
  readonly node = input.required<FlatNode<T>>();
  /**
   * When `true`, the row is highlighted while hovered.
   * Typically driven by `resolvedOptions().highlightRowOnHover`.
   * @defaultValue `false`
   */
  readonly highlight = input(false);
  /**
   * When `true`, applies the `cngx-treetable__row--selected` CSS class.
   * Driven by the selection model in {@link CngxTreetable}.
   * @defaultValue `false`
   */
  readonly selected = input(false);

  private readonly hoverable = inject(CngxHoverable, { host: true });
  /** `true` when both `highlight` is enabled and the row is currently hovered. */
  readonly highlighted = computed(() => this.highlight() && this.hoverable.hovered());
}
