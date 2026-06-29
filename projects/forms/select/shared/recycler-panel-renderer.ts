import { computed } from '@angular/core';

import type { CngxRecycler } from '@cngx/common/data';

import type { CngxSelectOptionDef } from './option.model';
import type {
  CngxPanelRendererFactory,
  PanelRendererInput,
  PanelRenderer,
} from './panel-renderer';

/**
 * Builds a {@link CngxPanelRendererFactory} backed by a consumer-owned
 * {@link CngxRecycler}. Slices `flatOptions` to the recycler window and
 * forwards spacer heights + setsize. Consumer wires
 * `connectRecyclerToActiveDescendant` separately; this factory doesn't
 * touch AD state.
 *
 * ```typescript
 * @Component({
 *   selector: 'my-huge-select',
 *   viewProviders: [
 *     {
 *       provide: CNGX_PANEL_RENDERER_FACTORY,
 *       useFactory: () => createRecyclerPanelRendererFactory(
 *         inject(MyHugeSelect).recycler,
 *       ),
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
 * @category forms/select/panel
 */
export function createRecyclerPanelRendererFactory(
  recycler: CngxRecycler,
): CngxPanelRendererFactory {
  return <T>(input: PanelRendererInput<T>): PanelRenderer<T> => {
    const renderOptions = computed<readonly CngxSelectOptionDef<T>[]>(
      () => {
        const all = input.flatOptions();
        const start = recycler.start();
        const end = recycler.end();
        if (start === 0 && end >= all.length) {
          // Window covers full list - return verbatim so upstream
          // identity-based equal stays stable.
          return all;
        }
        return all.slice(start, Math.min(end, all.length));
      },
      {
        // Structural equal - length + per-entry identity. Prevents @for
        // track-by thrash when the window doesn't move.
        equal: (a, b) => {
          if (a === b) {
            return true;
          }
          if (a.length !== b.length) {
            return false;
          }
          for (let i = 0; i < a.length; i++) {
            if (!Object.is(a[i], b[i])) {
              return false;
            }
          }
          return true;
        },
      },
    );

    const totalCount = computed<number>(() => input.flatOptions().length);

    return {
      renderOptions,
      totalCount,
      virtualizer: {
        startIndex: recycler.start,
        offsetBefore: recycler.offsetBefore,
        offsetAfter: recycler.offsetAfter,
        setsize: recycler.ariaSetSize,
        scrollToIndex: (i) => recycler.scrollToIndex(i),
      },
    };
  };
}
