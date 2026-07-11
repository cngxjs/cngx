import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import { CngxDgaFilter } from './data-grid-filter.directive';

/**
 * A ready-made filter row for a {@link CngxDataGridAccordion}: a full-width
 * `grid-column: 1 / -1` band with a visible `<label>` and a search input, so a
 * consumer drops `<cngx-dga-filter label="Filter invoices" />` instead of
 * hand-styling a `<div>` around a bare `<input cngxDgaFilter>`.
 *
 * It is a thin structural shell over the {@link CngxDgaFilter} brain, not a new
 * behaviour: the directive still owns the debounce, the two-way `filterTerm`
 * write, and the focused-caret guard. The shell adds only the chrome (span +
 * padding via `--cngx-dga-*` tokens) and a real `<label>` whose `for` binds the
 * input id, so the searchbox has a **visible** accessible name (WCAG 3.3.2)
 * rather than an invisible `aria-label` alone. The label text is mirrored onto
 * the directive's `cngxDgaFilterLabel` so the accessible name is the label, not
 * the directive's `'Filter rows'` default.
 *
 * ```html
 * <cngx-data-grid-accordion>
 *   <cngx-dga-filter label="Filter invoices" placeholder="Customer or invoice number" />
 *   <cngx-dga-header>…</cngx-dga-header>
 *   <!-- rows -->
 * </cngx-data-grid-accordion>
 * ```
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-filter-field.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgaFilter, CngxDgaCount
 */
@Component({
  selector: 'cngx-dga-filter',
  exportAs: 'cngxDgaFilterField',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxDgaFilter],
  templateUrl: './data-grid-filter-field.component.html',
  styleUrl: './data-grid-filter-field.component.css',
  host: {
    class: 'cngx-dga-filter-field',
  },
})
export class CngxDgaFilterField {
  /** Visible label text; also drives the input's accessible name. English default. */
  readonly label = input('Filter');
  /** Optional placeholder shown inside the input. */
  readonly placeholder = input<string | undefined>(undefined);
  /** Debounce in ms forwarded to the hosted `cngxDgaFilter`. */
  readonly debounce = input(200);

  /** Stable id linking the visible `<label for>` to the input. */
  protected readonly inputId = nextUid('cngx-dga-filter-');
}
