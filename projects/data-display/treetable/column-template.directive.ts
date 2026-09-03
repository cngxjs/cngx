import { Directive, inject, input, TemplateRef } from '@angular/core';
import type { CngxCellTplContext, CngxErrorTplContext, CngxSkeletonRowTplContext } from './models';

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

/**
 * Marks an `<ng-template>` as the per-row skeleton slot rendered during
 * the first load of a bound async state. The template repeats
 * `skeletonRowCount` times and replaces the default placeholder row
 * (toggle square plus two shimmer lines); the surrounding region stays
 * decorative (`aria-hidden`), so keep the template visual-only.
 *
 * The selector is `cngxSkeletonRow` (not `cngxSkeleton`) on purpose:
 * `[cngxSkeleton]` is the `@cngx/common/layout` loading atom, and a
 * shared attribute would instantiate both directives on the same
 * `<ng-template>`.
 *
 * ```html
 * <cngx-treetable [tree]="tree" [state]="loadState" [skeletonRowCount]="5">
 *   <ng-template cngxSkeletonRow let-index>
 *     <div class="my-shimmer-row"></div>
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/column-template.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxRefreshTpl, CngxEmptyTpl, CngxErrorTpl
 */
@Directive({ selector: 'ng-template[cngxSkeletonRow]', standalone: true })
export class CngxSkeletonRowTpl {
  /**
   * The projected `<ng-template>` reference, typed against
   * {@link CngxSkeletonRowTplContext}. Read by `CngxTreetable` via
   * `contentChild(CngxSkeletonRowTpl)` and rendered once per
   * placeholder row in place of the default skeleton row.
   * @internal
   */
  readonly template = inject(TemplateRef<CngxSkeletonRowTplContext>);
}

/**
 * Marks an `<ng-template>` as the refresh-indicator slot shown below
 * the grid while a bound async state refreshes over rows that stay on
 * screen. Replaces the default "Refreshing" text. The region is
 * decorative (`aria-hidden`) - the treetable's state live region
 * announces the refresh, so keep the template visual-only.
 *
 * ```html
 * <cngx-treetable [tree]="tree" [state]="loadState">
 *   <ng-template cngxRefresh>
 *     <my-spinner size="small" />
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/column-template.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxSkeletonRowTpl, CngxEmptyTpl, CngxErrorTpl
 */
@Directive({ selector: 'ng-template[cngxRefresh]', standalone: true })
export class CngxRefreshTpl {
  /**
   * The projected `<ng-template>` reference. Read by `CngxTreetable`
   * via `contentChild(CngxRefreshTpl)` and rendered inside the
   * refresh indicator in place of the default text.
   * @internal
   */
  readonly template = inject(TemplateRef<void>);
}

/**
 * Marks an `<ng-template>` as the error slot shown when a bound async
 * state fails - both on a first-load failure (grid gone) and on a
 * failed refresh over loaded rows (`content+error`). Gets the raw
 * error as `$implicit`, so the consumer can render the actual failure
 * instead of the default "Data failed to load" message.
 *
 * Do not add `role="alert"` inside the template: the treetable's
 * state live region already announces the failure, and an alert would
 * double-fire.
 *
 * ```html
 * <cngx-treetable [tree]="tree" [state]="loadState">
 *   <ng-template cngxError let-error>
 *     <p>Load failed: {{ describeError(error) }}</p>
 *     <button type="button" (click)="reload()">Retry</button>
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * @category data-display/treetable
 * @github https://github.com/cngxjs/cngx/blob/main/projects/data-display/treetable/column-template.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTreetable, CngxCellTpl, CngxHeaderTpl, CngxEmptyTpl
 */
@Directive({ selector: 'ng-template[cngxError]', standalone: true })
export class CngxErrorTpl {
  /**
   * The projected `<ng-template>` reference, typed against
   * {@link CngxErrorTplContext}. Read by `CngxTreetable` via
   * `contentChild(CngxErrorTpl)` and rendered in place of the default
   * error message on the `error` and `content+error` views.
   * @internal
   */
  readonly template = inject(TemplateRef<CngxErrorTplContext>);
}
