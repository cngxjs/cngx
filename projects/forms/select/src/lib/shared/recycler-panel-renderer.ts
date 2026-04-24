import { computed } from '@angular/core';

import type { CngxRecycler } from '@cngx/common/data';

import type { CngxSelectOptionDef } from './option.model';
import type {
  CngxPanelRendererFactory,
  PanelRendererInput,
  PanelRenderer,
} from './panel-renderer';

/**
 * Build a {@link CngxPanelRendererFactory} backed by a consumer-owned
 * {@link CngxRecycler}. The recycler provides the windowed
 * `start`/`end` indices + spacer heights; the factory slices
 * `flatOptions` to match and surfaces the virtualiser metadata the
 * panel template reads.
 *
 * **Usage pattern** (consumer side). The select-family variants
 * inject `CNGX_PANEL_RENDERER_FACTORY` at construction time, so the
 * consumer provides the factory via `viewProviders` on their own
 * component that wraps the `<cngx-select>`:
 *
 * ```typescript
 * @Component({
 *   selector: 'my-huge-select',
 *   viewProviders: [
 *     {
 *       provide: CNGX_PANEL_RENDERER_FACTORY,
 *       useFactory: () => {
 *         const host = inject(MyHugeSelect);
 *         return createRecyclerPanelRendererFactory(host.recycler);
 *       },
 *     },
 *   ],
 *   template: `<cngx-select [options]="data" ... />`,
 * })
 * class MyHugeSelect {
 *   readonly recycler = injectRecycler({
 *     scrollElement: '.cngx-select__panel',
 *     totalCount: () => this.data().length,
 *     estimateSize: 36,
 *     overscan: 5,
 *   });
 *   constructor() {
 *     const ad = inject(CngxActiveDescendant, { host: true, optional: true });
 *     if (ad) connectRecyclerToActiveDescendant(this.recycler, ad);
 *   }
 * }
 * ```
 *
 * **Contract**. The produced factory respects the four-point contract
 * in `CNGX_PANEL_RENDERER_FACTORY`:
 *   1. `renderOptions` is contiguous — `flatOptions.slice(start, end)`.
 *   2. Out-of-window AD navigation triggers `recycler.scrollToIndex`
 *      via `connectRecyclerToActiveDescendant` (the consumer wires
 *      that separately — this factory doesn't touch AD state).
 *   3. `totalCount` forwards `flatOptions().length` so
 *      `aria-setsize` stays truthful.
 *   4. All three exposed signals are `computed()` — the factory does
 *      not subscribe to RxJS or install `effect()`s of its own.
 *
 * @category interactive
 */
export function createRecyclerPanelRendererFactory(
  recycler: CngxRecycler,
): CngxPanelRendererFactory {
  return <T>(input: PanelRendererInput<T>): PanelRenderer<T> => {
    const renderOptions = computed<readonly CngxSelectOptionDef<T>[]>(() => {
      const all = input.flatOptions();
      const start = recycler.start();
      const end = recycler.end();
      if (start === 0 && end >= all.length) {
        // Shortcut — the recycler hasn't narrowed the window (e.g.
        // viewport larger than content). Return the source array
        // verbatim so identity-based equal functions upstream stay
        // stable and `renderOptions` doesn't slice-allocate each
        // emission.
        return all;
      }
      return all.slice(start, Math.min(end, all.length));
    });

    const totalCount = computed<number>(() => input.flatOptions().length);

    return {
      renderOptions,
      totalCount,
      virtualizer: {
        startIndex: recycler.start,
        offsetBefore: recycler.offsetBefore,
        offsetAfter: recycler.offsetAfter,
      },
    };
  };
}
