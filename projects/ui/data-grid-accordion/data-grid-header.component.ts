import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * The non-interactive column-header row of a {@link CngxDataGridAccordion}. Lays
 * its projected `cngxDgCell`s out on the shared `--cngx-dga-columns` grid so the
 * labels align with the data columns below. Carries `aria-hidden="true"`: the
 * column labels are visual scaffolding, and each row already announces its own
 * accessible name through its primary cell, so the header would only add noise to
 * the disclosure list a screen reader walks.
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-header.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgCell
 */
@Component({
  selector: 'cngx-data-grid-header',
  exportAs: 'cngxDataGridHeader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  host: {
    class: 'cngx-data-grid-header',
    'aria-hidden': 'true',
  },
})
export class CngxDataGridHeader {}
