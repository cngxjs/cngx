import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { nextUid, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { CNGX_ACCORDION, CngxAccordionPanel } from '@cngx/common/interactive';

import type { CngxDataGridSeverity } from './config/data-grid-accordion.config';
import { CNGX_DATA_GRID_ACCORDION } from './data-grid-accordion.token';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDgaRowBusy } from './data-grid-row-busy.directive';
import { CngxDgaRowError } from './data-grid-row-error.directive';

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
 * The projected `cngxDgaCell`s fill the summary grid; the one marked `primary`
 * supplies the row's accessible name, so a screen reader hears a list of
 * expandable sections rather than a wall of cell text.
 *
 * @category ui/data-grid-accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-row.component.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridAccordion, CngxDgCell, CngxAccordionPanel
 *
 * <example-url>http://localhost:4200/#/ui/data-grid-accordion/master-detail</example-url>
 * <example-url>http://localhost:4200/#/ui/data-grid-accordion/report</example-url>
 * <example-url>http://localhost:4200/#/ui/data-grid-accordion/lazy-row</example-url>
 */
@Component({
  selector: 'cngx-dga-row',
  exportAs: 'cngxDgaRow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxAccordionPanel, NgTemplateOutlet],
  templateUrl: './data-grid-row.component.html',
  styleUrl: './data-grid-row.component.css',
  host: {
    class: 'cngx-dga-row',
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
  /**
   * The row's async lifecycle, communicated to assistive tech. Accepts a raw
   * {@link AsyncStatus} or a {@link CngxAsyncState} the consumer already owns - the
   * row reads only the status discriminator, never the payload, so it stays
   * non-generic. A pure data input (the row injects no `CNGX_STATEFUL`), so no
   * empty-string transform: a bare string status must survive untouched. Mirrors
   * `CngxAccordionItem.state`; the consumer wires the fetch, the row only
   * communicates the state it is handed.
   */
  readonly state = input<AsyncStatus | CngxAsyncState<unknown> | undefined>(undefined);
  /** Error message announced in the error state. English default; override per locale. */
  readonly errorMessage = input('Failed to load');

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

  /** Per-instance busy slot; absent means the CSS skeleton default renders. */
  protected readonly busySlot = contentChild(CngxDgaRowBusy);
  /** Per-instance error slot; absent means the CSS error affordance default renders. */
  protected readonly errorSlot = contentChild(CngxDgaRowError);
  /** Resolved busy template: per-instance slot -> null (CSS skeleton default). */
  protected readonly busyTemplate = computed(() => this.busySlot()?.templateRef ?? null);
  /** Resolved error template: per-instance slot -> null (CSS error default). */
  protected readonly errorTemplate = computed(() => this.errorSlot()?.templateRef ?? null);

  /**
   * Row async status, normalised to an {@link AsyncStatus} from either the raw enum
   * or a {@link CngxAsyncState} object form (reads its `status()` signal). A
   * primitive, so `Object.is` dedupes - no `equal`. Mirrors `CngxAccordionItem`.
   */
  protected readonly status = computed<AsyncStatus | undefined>(() => {
    const state = this.state();
    if (state == null) {
      return undefined;
    }
    return typeof state === 'string' ? state : state.status();
  });
  /**
   * `aria-busy` driver. Mirrors `CngxAsyncState.isBusy` (loading|refreshing|pending)
   * so the string and object input forms agree. Boolean, no `equal`.
   */
  protected readonly busy = computed(() => {
    const status = this.status();
    return status === 'loading' || status === 'refreshing' || status === 'pending';
  });
  /**
   * Region visibility. Hidden while collapsed, EXCEPT in the error state: an errored
   * row un-hides its region so the `role="alert"` mounts into the live a11y tree and
   * is announced even when the row was never opened (Pillar 2 - an error is never
   * silenced by a collapsed row).
   */
  protected readonly regionHidden = computed(() => !this.expanded() && this.status() !== 'error');
}
