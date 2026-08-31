import { computed, Directive, inject, input } from '@angular/core';
import { CngxHoverable } from '@cngx/common';
import type { FlatNode } from './models';

/**
 * Row directive applied to every rendered table row in `CngxTreetable`.
 * Handles depth-based CSS indentation, hover highlight, selection styling,
 * and the APG treegrid row semantics (`aria-level`, `aria-posinset`,
 * `aria-setsize`, `aria-expanded`, `aria-selected`).
 *
 * Sets the `--cngx-row-depth` CSS custom property on the host element so that
 * cell padding can drive indentation via `calc()` in component stylesheets.
 * ```html
 * <div cngxTreetableRow [node]="node" [highlight]="highlight"></div>
 * ```
 * @typeParam T - The data type of the tree nodes.
 *
 * @category data-display/treetable
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/treetable-row.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxHoverable
 */
@Directive({
  selector: '[cngxTreetableRow]',
  standalone: true,
  hostDirectives: [CngxHoverable],
  host: {
    '[style.--cngx-row-depth]': 'node().depth',
    '[class.cngx-treetable__row--highlighted]': 'highlighted()',
    '[class.cngx-treetable__row--selected]': 'selected()',
    '[attr.aria-level]': 'node().depth + 1',
    '[attr.aria-posinset]': 'node().posinset',
    '[attr.aria-setsize]': 'node().setsize',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-selected]': 'selectionEnabled() ? selected() : null',
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
  /**
   * Expansion state announced via `aria-expanded`. `true` / `false` for
   * parent rows; `null` (the default) for leaves, which suppresses the
   * attribute entirely - APG treegrid leaves carry no `aria-expanded`.
   * @defaultValue `null`
   */
  readonly expanded = input<boolean | null>(null);
  /**
   * Gates the `aria-selected` binding. When `false` (the default) the
   * attribute is suppressed; when `true` it reflects `selected()`. Emit
   * the state only when selection applies - a non-selectable grid must
   * not announce every row as "not selected".
   * @defaultValue `false`
   */
  readonly selectionEnabled = input(false);

  private readonly hoverable = inject(CngxHoverable, { host: true });
  /** `true` when both `highlight` is enabled and the row is currently hovered. */
  readonly highlighted = computed(() => this.highlight() && this.hoverable.hovered());
}
