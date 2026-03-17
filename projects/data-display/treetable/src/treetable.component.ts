import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  contentChildren,
  inject,
} from '@angular/core';
import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkRow,
  CdkRowDef,
  CdkTable,
} from '@angular/cdk/table';
import { NgTemplateOutlet } from '@angular/common';
import { CngxTreetablePresenter } from './treetable-presenter';
import { CngxTreetableRow } from './treetable-row.directive';
import { CngxCellTpl, CngxEmptyTpl, CngxHeaderTpl } from './column-template.directive';
import { resolveCellTpl, resolveHeaderTpl } from './column-template.utils';


/**
 * Headless tree table built on Angular CDK Table.
 *
 * Renders a fully unstyled, accessible tree table using CDK primitives.
 * All visual styling is provided by `treetable.component.scss` via CSS custom
 * properties so consumers can theme it freely.
 *
 * **Basic usage**
 * ```html
 * <cngx-treetable [tree]="orgTree" (nodeClicked)="onNodeClick($event)" />
 * ```
 *
 * **Custom cell template**
 * ```html
 * <cngx-treetable [tree]="orgTree">
 *   <ng-template [cngxCell]="'name'" let-node>
 *     <strong>{{ node.value.name }}</strong>
 *   </ng-template>
 * </cngx-treetable>
 * ```
 *
 * All inputs and outputs are declared on {@link CngxTreetablePresenter} and
 * forwarded via `hostDirectives`.
 *
 * @typeParam T - The shape of the data value carried by each tree node.
 */
@Component({
  selector: 'cngx-treetable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxTreetablePresenter,
      inputs: ['tree', 'options', 'nodeId', 'expandedIds', 'selectionMode', 'showCheckboxes', 'selectedIds', 'trackBy'],
      outputs: ['nodeClicked', 'nodeExpanded', 'nodeCollapsed', 'expandedIdsChange', 'selectionChanged', 'selectedIdsChange'],
    },
  ],
  imports: [
    CdkTable,
    CdkColumnDef,
    CdkHeaderCellDef,
    CdkCellDef,
    CdkHeaderCell,
    CdkCell,
    CdkHeaderRow,
    CdkHeaderRowDef,
    CdkRow,
    CdkRowDef,
    CngxTreetableRow,
    NgTemplateOutlet,
  ],
  templateUrl: './treetable.component.html',
  styleUrl: './treetable.component.scss',
})
export class CngxTreetable<T> {
  /** @internal */
  protected readonly state = inject(CngxTreetablePresenter) as CngxTreetablePresenter<T>;
  /** @internal */
  protected readonly cellTpls = contentChildren(CngxCellTpl);
  /** @internal */
  protected readonly headerTpls = contentChildren(CngxHeaderTpl);
  /** @internal */
  protected readonly emptyTpl = contentChild(CngxEmptyTpl);

  /** @internal */
  protected cellTplFor(col: string) { return resolveCellTpl<T>(col, this.cellTpls); }

  /** @internal */
  protected headerTplFor(col: string) { return resolveHeaderTpl(col, this.headerTpls); }
}
