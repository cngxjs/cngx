import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { CngxRipple } from '@cngx/common/interactive';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Load-more segment: an append-don't-replace trigger over the same brain. One
 * `host.next()` button plus a `shown / total` count readout. The cumulative
 * slice is derived by the brain (`host.cumulativeRange()`); this segment holds
 * no accumulation state - the consumer slices its own array from
 * `cumulativeRange()`.
 *
 * Disabled (and so a no-op) on the last page or while busy. `aria-disabled`
 * (not native `disabled`) keeps the button focusable so AT hears the bound
 * state, matching the nav segments; the busy/position reason is already spoken
 * by the shell live region.
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/load-more/button</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-modes/load-more</example-url>
 */
@Component({
  selector: 'cngx-pgn-load-more',
  exportAs: 'cngxPgnLoadMore',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxRipple],
  template: `
    <button
      type="button"
      class="cngx-paginator__button cngx-paginator__load-more"
      cngxRipple
      [attr.aria-label]="ariaLabel()"
      [attr.aria-disabled]="disabled()"
      (click)="handleClick()"
    >
      <span class="cngx-paginator__load-more-label">{{ ariaLabel() }}</span>
      @if (!host.isLast()) {
        <span class="cngx-paginator__load-more-count" aria-hidden="true">
          {{ shown() }} / {{ host.total() }}
        </span>
      }
    </button>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorLoadMore {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  private readonly config = injectPaginatorConfig();

  /**
   * Accessible name from the config cascade. On the last page the actionable
   * `Load more` name is replaced with the exhausted-state `allLoaded` label so
   * AT does not announce an action on the disabled button.
   */
  protected readonly ariaLabel = computed(() =>
    this.host.isLast()
      ? this.config.ariaLabels.allLoaded(this.host.total())
      : this.config.ariaLabels.loadMore,
  );

  /** Disabled on the last page or while busy - the trigger becomes a no-op. */
  protected readonly disabled = computed(() => this.host.isLast() || this.host.isBusy());

  /**
   * Items revealed so far. The brain's `cumulativeRange()` upper bound is
   * uncapped (`(pageIndex + 1) * pageSize`), so a partial final page is clamped
   * to `total` here for an honest readout.
   */
  protected readonly shown = computed<number>(() =>
    Math.min(this.host.cumulativeRange()[1], this.host.total()),
  );

  /** Reveal the next page. Guarded so a disabled click is a no-op. */
  protected handleClick(): void {
    if (this.disabled()) {
      return;
    }
    this.host.next();
  }
}
