import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';
import { CNGX_ACCORDION, CngxAccordionPanel } from '@cngx/common/interactive';

import type { CngxDataGridSeverity } from './config/data-grid-accordion.config';
import { CNGX_DATA_GRID_ACCORDION } from './data-grid-accordion.token';
import { CngxDgCell } from './data-grid-cell.directive';

/**
 * A disclosure row in a {@link CngxDataGridAccordion}. Renders the APG-correct
 * trio: a `role="heading"` wrapper carrying the group's `aria-level`, a
 * `cngxAccordionPanel` summary `<button>` laid out on the shared
 * `--cngx-dga-columns` grid, and a `role="region"` detail zone named back at the
 * primary cell via `aria-labelledby`. Expansion is derived from the coordinator
 * (Pillar 1); the button self-wires keyboard nav through the registration brain,
 * so arrow keys rove across rows even though each summary lives in its own
 * component view.
 *
 * The projected `cngxDgCell`s fill the summary grid; the one marked `primary`
 * supplies the row's accessible name, so a screen reader hears a list of
 * expandable sections rather than a wall of cell text.
 *
 * @category ui/data-grid-accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-row.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgCell, CngxAccordionPanel
 */
@Component({
  selector: 'cngx-data-grid-row',
  exportAs: 'cngxDataGridRow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxAccordionPanel],
  templateUrl: './data-grid-row.component.html',
  styleUrl: './data-grid-row.component.css',
  host: {
    class: 'cngx-data-grid-row',
    '[attr.data-expanded]': "expanded() ? '' : null",
    '[attr.data-severity]': 'severity() ?? null',
  },
})
export class CngxDataGridRow {
  /**
   * Stable id this row registers under in the coordinator's open-set. Defaults to
   * a generated id; bind `[panelId]` to a stable row value to address the row
   * through the group's `[(openIds)]` model - so a sorted row stays open while it
   * moves. Mirrors `CngxAccordionItem.panelId`.
   */
  readonly panelId = input<string>(nextUid('cngx-dga-row-'));
  /**
   * Semantic severity reflected onto the `[data-severity]` host attribute for
   * skins that render it (the `log-stream` skin fills a coloured left edge from
   * the matching `--cngx-color-danger` / `-warning` / `-info` token). Purely
   * visual, no ARIA impact.
   */
  readonly severity = input<CngxDataGridSeverity | undefined>(undefined);

  private readonly accordion = inject(CNGX_ACCORDION);
  protected readonly grid = inject(CNGX_DATA_GRID_ACCORDION);

  protected readonly regionId = nextUid('cngx-dga-region-');
  protected readonly headerId = nextUid('cngx-dga-header-');

  /**
   * Projected cells; the `primary` one supplies the row's accessible name. Public
   * so {@link CngxDataGridAccordion} can read the primary-column index (for the
   * grow default) and use the first row as the column source when no header exists.
   */
  readonly cells = contentChildren(CngxDgCell);

  /**
   * IDREF of the primary cell, bound to the summary button's and the region's
   * `aria-labelledby`. `null` when no cell is marked `primary` - then the button
   * names itself from its projected content. A primitive, so `Object.is` dedupes.
   */
  protected readonly primaryId = computed<string | null>(
    () => this.cells().find((cell) => cell.primary())?.cellId ?? null,
  );

  /** Whether this row's region is open, derived from the coordinator's open-set. */
  protected readonly expanded = computed(() => this.accordion.isOpen(this.panelId()));
}
