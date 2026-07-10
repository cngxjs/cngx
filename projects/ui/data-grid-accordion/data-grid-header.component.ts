import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  ViewEncapsulation,
} from '@angular/core';

import { CngxDgCell } from './data-grid-cell.directive';

/**
 * The column-header row of a {@link CngxDataGridAccordion}. Lays its projected
 * `cngxDgaCell`s out on the shared `--cngx-dga-columns` grid so the labels align with
 * the data columns below. It is exposed to assistive tech (no `aria-hidden`) so a
 * `cngxDgaSortHeader` cell is reachable: a focusable sort control inside an
 * `aria-hidden` subtree would be pruned from the accessibility tree and fail
 * `aria-hidden-focus`, and `aria-hidden` cannot be undone by a descendant. The plain
 * label cells now read like a table header row - a small, acceptable trade for keeping
 * the sort controls operable. Each data row still announces its own name through its
 * primary cell, so the disclosure list stays legible.
 *
 * It is also the single **column source**: the group reads these header cells and
 * derives the shared `grid-template-columns` from each cell's `col` track intent
 * (`grow` / `fit` / `sm` / `md` / `lg`), so the columns are defined where they are
 * labelled rather than in a separate template string.
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-header.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgCell
 */
@Component({
  selector: 'cngx-dga-header',
  exportAs: 'cngxDgaHeader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  host: {
    class: 'cngx-dga-header',
  },
})
export class CngxDataGridHeader {
  /**
   * The projected header cells, in column order. Read by
   * {@link CngxDataGridAccordion} to derive the shared grid template from each
   * cell's `col` track intent.
   */
  readonly cells = contentChildren(CngxDgCell);
}
