import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * The footer row of a {@link CngxDataGridAccordion}. Lays its projected
 * `cngxDgCell`s out on the shared `--cngx-dga-columns` grid, so a sum or count
 * cell lines up with the column it totals. Unlike {@link CngxDataGridHeader} it
 * is NOT `aria-hidden`: the footer is the designated host for a consumer-supplied
 * `aria-live` region (row count, running totals, load status). The component
 * ships no live producer - the region element and its content are the consumer's,
 * so any state it announces stays owned outside this structural shell.
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-footer.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgCell
 */
@Component({
  selector: 'cngx-data-grid-footer',
  exportAs: 'cngxDataGridFooter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  host: {
    class: 'cngx-data-grid-footer',
  },
})
export class CngxDataGridFooter {}
