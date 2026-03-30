// Phase 4: connect-recycler-roving.ts — wires CngxRecycler to CngxRovingTabindex virtual mode

import { ElementRef, effect, inject, untracked } from '@angular/core';
// Type-only: CngxRovingTabindex is passed as an argument at runtime, not imported as a value.
// The consumer provides the instance via inject(CngxRovingTabindex, { host: true }).
import type { CngxRovingTabindex } from '@cngx/common/a11y';

import type { CngxRecycler } from './recycler';

/**
 * Wires a `CngxRecycler` to a `CngxRovingTabindex` in virtual mode.
 *
 * When the roving tabindex navigates to an item that is not in the DOM
 * (out of rendered range), this function scrolls the recycler to that item
 * and focuses it after rendering.
 *
 * Must be called in an injection context (constructor or field initializer)
 * **on the component that hosts both the recycler's scroll container and the
 * `CngxRovingTabindex` directive**. The injected `ElementRef` is used to query
 * `[data-cngx-recycle-index]` — calling from a child component would query the
 * wrong subtree.
 *
 * @usageNotes
 *
 * ```typescript
 * @Component({
 *   hostDirectives: [
 *     { directive: CngxRovingTabindex, inputs: ['orientation', 'activeIndex', 'virtualCount'] },
 *   ],
 * })
 * class MyVirtualList {
 *   private readonly roving = inject(CngxRovingTabindex, { host: true });
 *   readonly recycler = injectRecycler({ ... });
 *
 *   constructor() {
 *     connectRecyclerToRoving(this.recycler, this.roving);
 *   }
 * }
 * ```
 *
 * @category recycler
 */
export function connectRecyclerToRoving(
  recycler: CngxRecycler,
  roving: CngxRovingTabindex,
): void {
  const hostEl = inject(ElementRef).nativeElement as HTMLElement;

  // Debounce scrollToIndex via rAF to avoid scroll jitter on rapid keypresses.
  // Each keypress overwrites pendingFocus — only the latest target is scrolled to.
  let scrollRafId: number | null = null;

  effect((onCleanup) => {
    const target = roving.pendingFocus();
    if (target == null) {
      return;
    }
    if (scrollRafId != null) {
      cancelAnimationFrame(scrollRafId);
    }
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = null;
      // Re-read to get the latest target (rapid keypresses may have updated it).
      const latest = roving.pendingFocus();
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

  // When the recycler's range changes and the pending target is within range,
  // wait for the DOM to update (rAF), then query and focus the element.
  effect(() => {
    const s = recycler.start();
    const e = recycler.end();
    const target = untracked(() => roving.pendingFocus());
    if (target == null || target < s || target >= e) {
      return;
    }

    // Target is within rendered range — DOM will be updated after CD.
    // Use rAF to wait for Angular's rendering pass to complete.
    requestAnimationFrame(() => {
      // Re-read pendingFocus in case it changed during the frame (rapid keypresses).
      const currentTarget = roving.pendingFocus();
      if (currentTarget == null) {
        return;
      }
      const el = hostEl.querySelector(`[data-cngx-recycle-index="${currentTarget}"]`);
      if (el instanceof HTMLElement) {
        el.focus();
        roving.clearPendingFocus();
      }
    });
  });
}
