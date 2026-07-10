import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  ViewEncapsulation,
} from '@angular/core';

import { CngxDgCell } from './data-grid-cell.directive';

/**
 * The non-interactive column-header row of a {@link CngxDataGridAccordion}. Lays
 * its projected `cngxDgaCell`s out on the shared `--cngx-dga-columns` grid so the
 * labels align with the data columns below. Carries `aria-hidden="true"`: the
 * column labels are visual scaffolding, and each row already announces its own
 * accessible name through its primary cell, so the header would only add noise to
 * the disclosure list a screen reader walks.
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
    'aria-hidden': 'true',
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
