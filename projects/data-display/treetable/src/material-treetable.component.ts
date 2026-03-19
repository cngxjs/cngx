import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  contentChildren,
  inject,
} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { CngxTreetablePresenter } from './treetable-presenter';
import { CngxTreetableRow } from './treetable-row.directive';
import { CngxCellTpl, CngxEmptyTpl, CngxHeaderTpl } from './column-template.directive';
import { resolveCellTpl, resolveHeaderTpl } from './column-template.utils';

/**
 * Angular Material tree table.
 *
 * Renders a tree table using `<table mat-table>` and Angular Material's MDC
 * table components. Supports the full Material Design theming system via
 * `mat-treetable-theme.scss` — apply it in your global styles to activate
 * Material colour and density tokens.
 *
 * **Basic usage**
 * ```html
 * <cngx-mat-treetable [tree]="orgTree" (nodeClicked)="onNodeClick($event)" />
 * ```
 *
 * **With selection**
 * ```html
 * <cngx-mat-treetable
 *   [tree]="orgTree"
 *   selectionMode="single"
 *   (selectionChanged)="selected = $event" />
 * ```
 *
 * All inputs and outputs are declared on {@link CngxTreetablePresenter} and
 * forwarded via `hostDirectives`.
 *
 * @typeParam T - The shape of the data value carried by each tree node.
 */
@Component({
  selector: 'cngx-mat-treetable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxTreetablePresenter,
      inputs: [
        'tree',
        'options',
        'nodeId',
        'expandedIds',
        'selectionMode',
        'showCheckboxes',
        'selectedIds',
        'trackBy',
      ],
      outputs: [
        'nodeClicked',
        'nodeExpanded',
        'nodeCollapsed',
        'expandedIdsChange',
        'selectionChanged',
        'selectedIdsChange',
      ],
    },
  ],
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderCell,
    MatCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatIconButton,
    MatCheckbox,
    MatIcon,
    CngxTreetableRow,
    NgTemplateOutlet,
  ],
  templateUrl: './material-treetable.component.html',
  styleUrl: './material-treetable.component.scss',
})
export class CngxMaterialTreetable<T> {
  /** @internal */
  protected readonly state = inject(CngxTreetablePresenter) as CngxTreetablePresenter<T>;
  /** @internal */
  protected readonly cellTpls = contentChildren(CngxCellTpl);
  /** @internal */
  protected readonly headerTpls = contentChildren(CngxHeaderTpl);
  /** @internal */
  protected readonly emptyTpl = contentChild(CngxEmptyTpl);

  /** @internal */
  protected cellTplFor(col: string) {
    return resolveCellTpl<T>(col, this.cellTpls);
  }

  /** @internal */
  protected headerTplFor(col: string) {
    return resolveHeaderTpl(col, this.headerTpls);
  }
}
