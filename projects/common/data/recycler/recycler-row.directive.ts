import { Directive, input, type TemplateRef } from '@angular/core';

import type { CngxRecycler } from './recycler';

/**
 * Context for the placeholder branch of `*cngxRecyclerRow` - the window slot
 * whose item has not loaded yet (`undefined`). A custom `placeholder:` template
 * reads this to keep the list count honest for assistive technology:
 * `aria-posinset = index + 1`, `aria-setsize = setSize`.
 *
 * The real-row branch (item defined) binds `$implicit` to the item value
 * instead; that context is internal and narrowed by `ngTemplateContextGuard`.
 *
 * @category common/data/recycler
 */
export interface CngxRecyclerRowContext {
  /** The absolute dataset index of this slot. Alias of `index`. */
  $implicit: number;
  /** The absolute dataset index of this slot. */
  index: number;
  /** Pixel offset of the slot from the top of the scroll content. */
  top: number;
  /** Total set size (`recycler.ariaSetSize()`) for `aria-setsize`. */
  setSize: number;
}

/** Internal real-row context: the loaded item at this window position. */
interface CngxRecyclerRowRealContext<T> {
  $implicit: T;
  cngxRecyclerRow: T;
}

/**
 * Per-window-position render switch for a sparse/windowed recycler: renders the
 * consumer's real-row template when the sliced item is defined, and a
 * placeholder branch when the item is still `undefined` (loaded window, data
 * not yet resolved).
 *
 * Mirrors the `*cngxAsync` structural-directive shape (own `TemplateRef` +
 * microsyntax alternate template + `ngTemplateContextGuard`). The switch axis is
 * data availability, not async status, so the two are siblings, not the same
 * class.
 *
 * @category common/data/recycler
 */
@Directive({
  selector: '[cngxRecyclerRow]',
  standalone: true,
})
export class CngxRecyclerRow<T> {
  /** The sliced item at this window position. `undefined` selects the placeholder branch. */
  readonly cngxRecyclerRow = input<T | undefined>(undefined);

  /** Absolute dataset index of this slot (`recycler.start() + $index`). */
  readonly cngxRecyclerRowIndex = input.required<number>();

  /** The recycler driving the window, read for `rowSizeHint` (-> `top`) and `ariaSetSize`. */
  readonly cngxRecyclerRowRecycler = input.required<CngxRecycler>();

  /** Optional placeholder template for the `undefined` branch. Context: {@link CngxRecyclerRowContext}. */
  readonly cngxRecyclerRowPlaceholder = input<TemplateRef<CngxRecyclerRowContext> | undefined>(
    undefined,
  );

  /** Narrows the directive's own template context to the loaded item type. */
  static ngTemplateContextGuard<T>(
    _dir: CngxRecyclerRow<T>,
    _ctx: unknown,
  ): _ctx is CngxRecyclerRowRealContext<T> {
    return true;
  }
}
