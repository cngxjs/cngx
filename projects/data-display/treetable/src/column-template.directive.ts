import { Directive, inject, input, TemplateRef } from '@angular/core';
import type { CngxCellTplContext } from './models';

/**
 * Marks an `<ng-template>` as a custom cell template for a named column.
 * The template context is typed as {@link CngxCellTplContext}.
 *
 * Apply to an `<ng-template>` inside `<cngx-treetable>` or `<cngx-mat-treetable>`:
 *
 * ```html
 * <cngx-treetable [tree]="tree">
 *   <ng-template [cngxCell]="'name'" let-node let-value="value">
 *     <strong>{{ value }}</strong> — depth {{ node.depth }}
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @typeParam T - The data type of the tree nodes.
 */
@Directive({ selector: 'ng-template[cngxCell]', standalone: true })
export class CngxCellTpl<T = unknown> {
  /** The column key this template replaces. Bound via the `cngxCell` attribute. */
  readonly column = input.required<string>({ alias: 'cngxCell' });
  /** @internal */
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
 */
@Directive({ selector: 'ng-template[cngxHeader]', standalone: true })
export class CngxHeaderTpl {
  /** The column key whose header this template replaces. */
  readonly column = input.required<string>({ alias: 'cngxHeader' });
  /** @internal */
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
 */
@Directive({ selector: 'ng-template[cngxEmpty]', standalone: true })
export class CngxEmptyTpl {
  /** @internal */
  readonly template = inject(TemplateRef<void>);
}
