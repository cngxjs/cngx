import { computed, Directive, input, model } from '@angular/core';

import {
  CNGX_BUCKET_PAGINATE_HOST,
  type CngxBucketPaginateHost,
} from './bucket-paginate-host.token';

/**
 * A category bucket: a label plus a predicate that decides which items fall
 * into it. The predicate keeps the model content-agnostic - the same directive
 * buckets by letter range, date band, price tier, or any other partition the
 * consumer expresses, without the brain knowing what it is bucketing.
 *
 * @category common/data/paginate
 */
export interface CngxBucket<T> {
  /** Human-readable bucket label, e.g. `'A-C'`. Rendered as the chip text. */
  readonly label: string;
  /** Returns `true` when `item` belongs to this bucket. */
  readonly match: (item: T) => boolean;
}

/** Two `ReadonlySet`s are equal when they hold the same members. */
function setEquals(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Range/category pagination model - a sibling to {@link CngxPaginate}, NOT a
 * mode flag on it. Where `CngxPaginate` steps a page index over a slice window,
 * this directive partitions a collection into labelled buckets (letter ranges,
 * date bands, price tiers) and tracks which one is active. The page-index brain
 * stays single-responsibility; a consumer composes whichever model the data
 * calls for (Komposition statt Konfiguration).
 *
 * The empty/disabled state of every bucket is **derived**, never managed: a
 * bucket is empty when no bound item matches its predicate, computed from the
 * `items` / `buckets` inputs. There is no synced flag and no effect.
 *
 * `active` is the two-way primary value (a `model<string | null>()`):
 * `null` shows the unfiltered collection; a label filters to that bucket.
 * `select(label)` toggles - re-selecting the active bucket clears it.
 *
 * ```html
 * <div
 *   cngxBucketPaginate
 *   #bp="cngxBucketPaginate"
 *   [buckets]="letterBuckets"
 *   [items]="people"
 *   [(active)]="activeBucket"
 * >
 *   @for (p of bp.active() ? people.filter(byActiveBucket) : people; track p.id) { ... }
 * </div>
 * ```
 *
 * @category common/data/paginate
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/paginate/bucket-paginate.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPaginate, CngxFilter
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-modes/alphabetical</example-url>
 */
@Directive({
  selector: '[cngxBucketPaginate]',
  exportAs: 'cngxBucketPaginate',
  standalone: true,
  providers: [{ provide: CNGX_BUCKET_PAGINATE_HOST, useExisting: CngxBucketPaginate }],
})
export class CngxBucketPaginate<T = unknown> implements CngxBucketPaginateHost {
  /** The buckets to partition into, in render order. One chip per entry. */
  readonly buckets = input<readonly CngxBucket<T>[]>([]);
  /** The collection the buckets test against. Drives the derived empty state. */
  readonly items = input<readonly T[]>([]);

  /**
   * Active bucket label, or `null` for the unfiltered collection. The two-way
   * primary value (`[(active)]`); a `model()` because it is the directive's
   * bindable state, not a derived read.
   */
  readonly active = model<string | null>(null);

  /**
   * Labels of every bucket whose predicate matches no bound item. A pure
   * `computed()` over `items` / `buckets` - the disabled chips read this, so
   * the empty state is derived, never synced. The explicit set `equal` stops a
   * fresh-`Set` identity from cascading downstream on every unrelated recompute.
   */
  private readonly emptyLabels = computed<ReadonlySet<string>>(
    () => {
      const items = this.items();
      const empties = new Set<string>();
      for (const bucket of this.buckets()) {
        if (!items.some((item) => bucket.match(item))) {
          empties.add(bucket.label);
        }
      }
      return empties;
    },
    { equal: setEquals },
  );

  /** `true` when no bound item falls into the bucket. */
  isEmpty(label: string): boolean {
    return this.emptyLabels().has(label);
  }

  /**
   * Select the bucket, or clear the selection when it is already active
   * (toggle). An empty bucket is a no-op - it never becomes the active filter.
   */
  select(label: string): void {
    if (this.isEmpty(label)) {
      return;
    }
    this.active.update((current) => (current === label ? null : label));
  }

  /** Clear the active bucket - show the unfiltered collection. */
  clear(): void {
    this.active.set(null);
  }
}
