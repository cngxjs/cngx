import { Directive, inject, input, TemplateRef } from '@angular/core';
import type { CngxCellTplContext } from './models';

/**
 * Marks an `<ng-template>` as a custom cell template for a named column.
 * The template context is typed as {@link CngxCellTplContext}.
 *
 * Apply to an `<ng-template>` inside `<cngx-treetable>`:
 *
 * ```html
 * <cngx-treetable [tree]="tree">
 *   <ng-template [cngxCell]="'name'" let-node let-value="value">
 *     <strong>{{ value }}</strong> - depth {{ node.depth }}
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @typeParam T - The data type of the tree nodes.
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/column-template.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxHeaderTpl, CngxEmptyTpl
 */
@Directive({ selector: 'ng-template[cngxCell]', standalone: true })
export class CngxCellTpl<T = unknown> {
  /** The column key this template replaces. Bound via the `cngxCell` attribute. */
  readonly column = input.required<string>({ alias: 'cngxCell' });
  /**
   * The projected `<ng-template>` reference, typed against
   * {@link CngxCellTplContext}. Read by `CngxTreetable` via
   * `contentChildren(CngxCellTpl)` and routed to the matching CDK
   * column - consumers typically never touch this directly.
   * @internal
   */
  readonly template = inject(TemplateRef<CngxCellTplContext<T>>);
}

/**
 * Marks an `<ng-template>` as a custom header template for a named column.
 *
 * ```html
 * <cngx-treetable [tree]="tree">
 *   <ng-template [cngxHeader]="'name'">
 *     Full Name <mat-icon>sort</mat-icon>
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/column-template.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxCellTpl, CngxEmptyTpl
 */
@Directive({ selector: 'ng-template[cngxHeader]', standalone: true })
export class CngxHeaderTpl {
  /** The column key whose header this template replaces. */
  readonly column = input.required<string>({ alias: 'cngxHeader' });
  /**
   * The projected `<ng-template>` reference. Read by `CngxTreetable`
   * via `contentChildren(CngxHeaderTpl)` and rendered into the matching
   * column's header cell.
   * @internal
   */
  readonly template = inject(TemplateRef<void>);
}

/**
 * Marks an `<ng-template>` as the empty-state slot shown when the tree
 * contains no visible rows. If omitted, a default "No data" message is shown.
 *
 * ```html
 * <cngx-treetable [tree]="tree">
 *   <ng-template cngxEmpty>
 *     <p>Nothing to display.</p>
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/column-template.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxCellTpl, CngxHeaderTpl
 */
@Directive({ selector: 'ng-template[cngxEmpty]', standalone: true })
export class CngxEmptyTpl {
  /**
   * The projected `<ng-template>` reference. Read by `CngxTreetable`
   * via `contentChild(CngxEmptyTpl)` and rendered in place of the
   * default "No data" message when `isEmpty()` is true.
   * @internal
   */
  readonly template = inject(TemplateRef<void>);
}
