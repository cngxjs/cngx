import { effect, untracked } from '@angular/core';

// type-only: passed in by the consumer at runtime, so @cngx/common/data
// avoids a value-level dep on a11y
import type { CngxActiveDescendant } from '@cngx/common/a11y';

import type { CngxRecycler } from './recycler';

/**
 * Wires a {@link CngxRecycler} to a {@link CngxActiveDescendant} in
 * virtual mode.
 *
 * When the AD directive navigates to an item whose index is not in the
 * recycler's rendered range, it sets `pendingHighlight` (via the
 * `virtualCount` path). This helper watches that signal and scrolls
 * the recycler to the target index; AD's own effect observes the
 * resulting DOM update and clears the pending state automatically
 * (see the `pendingHighlightState.set(null)` branch in
 * `CngxActiveDescendant` after a re-render brings the target into the
 * rendered range).
 *
 * Unlike {@link /projects/common/data/src/recycler/connect-recycler-roving.ts
 * connectRecyclerToRoving}, we don't re-focus a DOM element after the
 * scroll — AD doesn't move real focus, it only rebinds
 * `aria-activedescendant`. Once the target index enters the rendered
 * range, the `[attr.aria-activedescendant]` binding on the combobox
 * trigger resolves to the now-present option element for free.
 *
 * Must be called in an injection context (typically a component
 * constructor) on the same component that owns both the recycler
 * and the AD directive.
 *
 * ```typescript
 * @Component({
 *   hostDirectives: [
 *     { directive: CngxActiveDescendant, inputs: ['items', 'virtualCount'] },
 *   ],
 * })
 * class MyVirtualSelect {
 *   private readonly ad = inject(CngxActiveDescendant, { host: true });
 *   readonly recycler = injectRecycler({ ... });
 *
 *   constructor() {
 *     connectRecyclerToActiveDescendant(this.recycler, this.ad);
 *   }
 * }
 * ```
 *
 * @category common/data/recycler
 */
export function connectRecyclerToActiveDescendant(
  recycler: CngxRecycler,
  ad: CngxActiveDescendant,
): void {
  // rAF-debounced: held ArrowDown otherwise enqueues one scroll per keystroke.
  // Each new pending target overwrites the previous rAF, only the latest lands.
  let scrollRafId: number | null = null;

  effect((onCleanup) => {
    const target = ad.pendingHighlight();
    if (target == null) {
      return;
    }
    if (scrollRafId != null) {
      cancelAnimationFrame(scrollRafId);
    }
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      // re-read inside the frame so the latest target wins if the user kept typing
      const latest = untracked(() => ad.pendingHighlight());
      if (latest != null) {
        recycler.scrollToIndex(latest);
      }
    });
    onCleanup(() => {
      if (scrollRafId != null) {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = null;
      }
    });
  });
}
