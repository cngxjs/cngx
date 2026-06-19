import { InjectionToken, type Signal } from '@angular/core';

/**
 * A single bucket as the chips segment reads it - the label only. The match
 * predicate that decides membership stays internal to `CngxBucketPaginate`; a
 * presentation segment never needs it, only the label to render and the
 * derived empty/active state to reflect.
 *
 * @category common/data/paginate
 */
export interface CngxBucketPaginateView {
  /** Human-readable bucket label, e.g. `'A-C'`. Rendered as the chip text. */
  readonly label: string;
}

/**
 * Read-and-write contract a category/range chip strip (`cngx-pgn-alpha`)
 * injects instead of the concrete `CngxBucketPaginate` directive. \
 * The directive provides it via `useExisting`, so a chip strip stays
 * decompose-ready - it talks to the token, never to the model class (DI
 * abstraction).
 *
 * The signals are the single derivation source for every chip's pressed and
 * disabled state; `select` / `clear` are the only write paths, each routing
 * through the directive's `active` model so the toggle invariant (re-selecting
 * the active bucket clears it) holds in one place.
 *
 * @category common/data/paginate
 */
export interface CngxBucketPaginateHost {
  /** The buckets to render, in declaration order. One chip per entry. */
  readonly buckets: Signal<readonly CngxBucketPaginateView[]>;
  /** Label of the active bucket, or `null` when no bucket is selected. */
  readonly active: Signal<string | null>;
  /**
   * `true` when no bound item matches the bucket's predicate. Derived from the
   * `items` / `buckets` inputs (never a synced flag); a chip binds its disabled
   * state to this so an empty bucket is a dead control with a stated reason.
   */
  isEmpty(label: string): boolean;
  /**
   * Select the bucket. Re-selecting the already-active bucket clears the
   * selection (toggle). No-op for an empty bucket.
   */
  select(label: string): void;
  /** Clear the active bucket (show the unfiltered collection). */
  clear(): void;
}

/**
 * DI token the `CngxBucketPaginate` range model provides via `useExisting`.
 * The category chips segment (`cngx-pgn-alpha`) injects this rather than the
 * concrete directive class, keeping the strip decompose-ready and the model
 * swappable.
 *
 * @category common/data/paginate
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/paginate/bucket-paginate-host.token.ts
 * @since 0.1.0
 */
export const CNGX_BUCKET_PAGINATE_HOST = new InjectionToken<CngxBucketPaginateHost>(
  'CngxBucketPaginateHost',
);
