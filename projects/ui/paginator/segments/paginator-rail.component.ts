import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { CngxProgress } from '@cngx/ui/feedback';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Progress-rail segment: a horizontal rail whose fill tracks the current page
 * position, with an overlaid knob riding the fill edge. The track, fill, and
 * `role="progressbar"` a11y are composed from the `CngxProgress` atom - not
 * reinvented here (same precedent as the progress-bar stepper). The only new
 * part is the position knob, a decorative (`aria-hidden`) dot positioned by an
 * inline `inset-inline-start.%`, which `CngxProgress` cannot express. The fill
 * percentage derives purely from the host `pageIndex()`/`totalPages()` signals -
 * no local state, no writes.
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/rail/rail</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/rail</example-url>
 */
@Component({
  selector: 'cngx-pgn-rail',
  exportAs: 'cngxPgnRail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxProgress],
  template: `
    <div class="cngx-paginator__rail">
      <cngx-progress
        variant="linear"
        [progress]="fillPercent()"
        [label]="config.ariaLabels.railPosition"
      />
      <span
        class="cngx-paginator__rail-knob"
        aria-hidden="true"
        [style.inset-inline-start.%]="fillPercent()"
      ></span>
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorRail {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();

  /**
   * Fill percentage (0-100) of the current page across the page span. A single
   * page (or none) reads 0; the last page reads 100. Drives both the composed
   * `cngx-progress` `[progress]` and the knob's inline position.
   */
  protected readonly fillPercent = computed<number>(() => {
    const total = this.host.totalPages();
    return total <= 1 ? 0 : (this.host.pageIndex() / (total - 1)) * 100;
  });
}
