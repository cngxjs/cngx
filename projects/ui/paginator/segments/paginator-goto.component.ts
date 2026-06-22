import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Go-to-page segment: a native `<input type="number">`. Typing (or the spinner)
 * navigates live via `input`; Enter / blur additionally clamp and re-sync the
 * field. The brain clamps out-of-range values, so the field reflects the clamped
 * page back. Accessible name from config (EN default, Pillar 2).
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-segments/go-to-page</example-url>
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
      (input)="navigate($event)"
      (keydown.enter)="commit($event)"
      (blur)="commit($event)"
    />
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorGoto {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();

  /** Live navigation on every keystroke / spinner step - no field re-sync, so
   * typing is never interrupted; the clamp re-sync happens on commit. */
  protected navigate(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value) && value >= 1) {
      this.host.setPage(value - 1);
    }
  }

  protected commit(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isFinite(value) && value >= 1) {
      this.host.setPage(value - 1);
    }
    // Re-sync the field to the effective page: the brain may have clamped to a
    // bound (no signal change, so the [value] binding would not refresh), or
    // rejected an empty / sub-1 entry. Either way the field shows the truth.
    input.value = String(this.host.pageIndex() + 1);
  }
}
