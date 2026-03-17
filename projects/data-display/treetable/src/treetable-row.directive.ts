import { computed, Directive, inject, input } from '@angular/core';
import { CngxHoverable } from '@cngx/common';
import type { FlatNode } from './models';

/**
 * Row directive applied to every rendered table row in both `CngxTreetable` and
 * `CngxMaterialTreetable`. Handles depth-based CSS indentation, hover highlight,
 * and selection styling.
 *
 * Sets the `--cngx-row-depth` CSS custom property on the host element so that
 * cell padding can drive indentation via `calc()` in component stylesheets.
 *
 * @typeParam T - The data type of the tree nodes.
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
  node = input.required<FlatNode<T>>();
  /**
   * When `true`, the row is highlighted while hovered.
   * Typically driven by `resolvedOptions().highlightRowOnHover`.
   * @defaultValue `false`
   */
  highlight = input(false);
  /**
   * When `true`, applies the `cngx-treetable__row--selected` CSS class.
   * Driven by the selection model in {@link CngxTreetablePresenter}.
   * @defaultValue `false`
   */
  selected = input(false);

  private readonly hoverable = inject(CngxHoverable);
  /** `true` when both `highlight` is enabled and the row is currently hovered. */
  readonly highlighted = computed(() => this.highlight() && this.hoverable.hovered());
}
