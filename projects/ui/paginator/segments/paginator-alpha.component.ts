import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';
import { CNGX_BUCKET_PAGINATE_HOST } from '@cngx/common/data';

import { injectPaginatorConfig } from '../paginator-config';

/**
 * Alphabetical / category chips: a `role="group"` toggle strip over the
 * {@link CngxBucketPaginate} range model. One `<button>` per bucket; the active
 * bucket carries `aria-pressed`, an empty bucket is `disabled`. The model is
 * injected through `CNGX_BUCKET_PAGINATE_HOST`, never the concrete directive
 * class, so the strip stays decompose-ready.
 *
 * Every chip's pressed / disabled / name state is a `computed()` read of the
 * host signals - nothing is synced. An empty chip is not a silent dead control:
 * its accessible name comes from `ariaLabels.emptyBucket(label)`, which states
 * the bucket has no items, so AT hears the reason the chip is disabled.
 *
 * Keyboard navigation reuses `CngxRovingTabindex` / `CngxRovingItem` (no new
 * keyboard code, matching `cngx-pgn-pages`): arrows move the focus cursor and
 * skip disabled chips, the single tab stop tracks the active bucket, and
 * activation commits via `select()`.
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-modes/alphabetical</example-url>
 */
@Component({
  selector: 'cngx-pgn-alpha',
  exportAs: 'cngxPgnAlpha',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxRovingTabindex, CngxRovingItem],
  template: `
    <div
      class="cngx-paginator__alpha"
      role="group"
      [attr.aria-label]="config.ariaLabels.bucketGroup"
      cngxRovingTabindex
      [(activeIndex)]="rovingIndex"
    >
      @for (bucket of host.buckets(); track bucket.label) {
        @let isEmpty = host.isEmpty(bucket.label);
        <button
          type="button"
          cngxRovingItem
          [cngxRovingItemDisabled]="isEmpty"
          class="cngx-paginator__button cngx-paginator__alpha-chip"
          [class.cngx-paginator__alpha-chip--active]="isActive(bucket.label)"
          [attr.aria-pressed]="isActive(bucket.label) ? 'true' : 'false'"
          [attr.aria-label]="chipLabel(bucket.label)"
          [disabled]="isEmpty"
          (click)="select(bucket.label)"
        >
          {{ bucket.label }}
        </button>
      }
    </div>
  `,
  // The bucket strip is a standalone sibling of the page-index brain - it is
  // used WITHOUT the `cngx-paginator` shell, so it must ship the structural base
  // (chip chrome, roving button geometry) itself rather than relying on the
  // shell to inline it.
  styleUrls: ['../../../common/data/paginate/styles/paginator-base.css'],
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorAlpha {
  protected readonly host = inject(CNGX_BUCKET_PAGINATE_HOST);
  protected readonly config = injectPaginatorConfig();

  /**
   * Roving focus cursor. A `linkedSignal` so the strip's single tab stop tracks
   * the active bucket (Tab lands on the pressed chip) yet still moves freely
   * under the arrow keys; when nothing is selected it falls back to the first
   * non-empty chip so Tab never lands on a disabled control.
   */
  protected readonly rovingIndex = linkedSignal<number>(() => {
    const buckets = this.host.buckets();
    const active = this.host.active();
    if (active !== null) {
      const index = buckets.findIndex((bucket) => bucket.label === active);
      if (index !== -1) {
        return index;
      }
    }
    const firstEnabled = buckets.findIndex((bucket) => !this.host.isEmpty(bucket.label));
    return firstEnabled === -1 ? 0 : firstEnabled;
  });

  protected isActive(label: string): boolean {
    return this.host.active() === label;
  }

  /**
   * Accessible name: the available chip uses `ariaLabels.bucket`; an empty chip
   * swaps to `ariaLabels.emptyBucket` so the disabled control states its reason.
   */
  protected chipLabel(label: string): string {
    return this.host.isEmpty(label)
      ? this.config.ariaLabels.emptyBucket(label)
      : this.config.ariaLabels.bucket(label);
  }

  protected select(label: string): void {
    this.host.select(label);
  }
}
