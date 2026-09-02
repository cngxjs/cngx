import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Go-to-page segment: a native `<input type="number">`. \
 * Navigation happens on commit only (Enter / blur) - never per keystroke, so a
 * multi-digit entry survives async paging: navigating on the first digit would
 * flip the brain busy and swallow the rest of the entry. The brain clamps
 * out-of-range values; the commit re-syncs the field to the effective page
 * unless the brain is busy (a busy commit is a no-op and the typed value must
 * survive until the user can retry). Accessible name from config (EN default,
 * Pillar 2).
 *
 * @category ui/paginator
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/segments/paginator-goto.component.ts
 * @since 0.1.0
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/goto/input</example-url>
 */
@Component({
  selector: 'cngx-pgn-goto',
  exportAs: 'cngxPgnGoto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <input
      type="number"
      class="cngx-paginator__goto-input"
      min="1"
      [max]="host.totalPages()"
      [value]="host.pageIndex() + 1"
      [attr.aria-label]="config.ariaLabels.goToPage"
      [attr.aria-disabled]="host.isBusy() ? 'true' : null"
      (keydown.enter)="commit($event)"
      (blur)="commit($event)"
    />
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorGoto {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();

  /**
   * Commit the typed page (Enter / blur). Navigation is commit-only: a
   * per-keystroke setPage would flip the brain busy on async data after the
   * first digit and swallow the rest of a multi-digit entry.
   */
  protected commit(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isFinite(value) && value >= 1) {
      this.host.setPage(value - 1);
    }
    // Re-sync the field to the effective page: the brain may have clamped to a
    // bound (no signal change, so the [value] binding would not refresh), or
    // rejected an empty / sub-1 entry. Skipped while busy - the commit above
    // was a no-op on the busy gate, and stomping the field would destroy the
    // entry the user still means to submit.
    if (!this.host.isBusy()) {
      input.value = String(this.host.pageIndex() + 1);
    }
  }
}
