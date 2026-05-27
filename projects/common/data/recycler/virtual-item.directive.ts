import { Directive, computed, input } from '@angular/core';

import type { CngxRecycler } from './recycler';

/**
 * A11y atom that sets `aria-setsize`, `aria-posinset`, and `data-cngx-recycle-index`
 * on each rendered virtual item. Replaces manual ARIA boilerplate.
 *
 * Also provides `data-cngx-recycle-index` for focus tracking — consumers who
 * don't use `CngxMeasure` (grid mode, uniform heights) get focus tracking for free.
 *
 * Does NOT set `role` — the consumer decides (`listitem`, `option`, `treeitem`, `tab`).
 *
 * ```html
 * @for (item of visibleItems(); track item.id; let i = $index) {
 *   <div role="listitem"
 *        [cngxVirtualItem]="recycler"
 *        [cngxVirtualItemIndex]="recycler.start() + i">
 *     {{ item.name }}
 *   </div>
 * }
 * ```
 *
 * @category common/data/recycler
 *
 * <example-url>http://localhost:4200/#/common/data/recycler/basic-list-fixed-item-height</example-url>
 * <example-url>http://localhost:4200/#/common/data/recycler/content-visibility-css-only</example-url>
 * <example-url>http://localhost:4200/#/common/data/recycler/infinite-scroll-recycler</example-url>
 * <example-url>http://localhost:4200/#/common/data/recycler/scrolltoindex-deep-link</example-url>
 * <example-url>http://localhost:4200/#/common/data/recycler/variable-heights-cngxmeasure</example-url>
 * <example-url>http://localhost:4200/#/common/data/recycler/with-cngxasyncstate-skeleton-first-load</example-url>
 */
@Directive({
  selector: '[cngxVirtualItem]',
  standalone: true,
  host: {
    '[attr.aria-setsize]': 'ariaSetSize()',
    '[attr.aria-posinset]': 'ariaPosinset()',
    '[attr.data-cngx-recycle-index]': 'cngxVirtualItemIndex()',
  },
})
export class CngxVirtualItem {
  /** The recycler instance providing `ariaSetSize`. */
  readonly cngxVirtualItem = input.required<CngxRecycler>();

  /** The absolute 0-based index of this item in the full dataset. */
  readonly cngxVirtualItemIndex = input.required<number>();

  /** Total item count for `aria-setsize`. */
  protected readonly ariaSetSize = computed(() => this.cngxVirtualItem().ariaSetSize());

  /** 1-based position for `aria-posinset`. */
  protected readonly ariaPosinset = computed(() => this.cngxVirtualItemIndex() + 1);
}
