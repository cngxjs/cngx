import { computed, effect, inject, untracked, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import { createAutoPanelRenderer } from './auto-virtualize';
import type { CngxSelectVirtualizationConfig } from './config';
import {
  CNGX_PANEL_RENDERER_FACTORY,
  type PanelRenderer,
} from './panel-renderer';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';

/**
 * Shared virtualisation wire-up for every select-family variant that
 * renders options via `CngxSelectPanel`. Consolidates the four
 * concerns each variant used to re-implement:
 *
 *   1. **Panel renderer cascade.** Consumer-supplied
 *      `CNGX_PANEL_RENDERER_FACTORY` wins when it returns a
 *      virtualising renderer; otherwise the config-driven
 *      `createAutoPanelRenderer` kicks in when
 *      `CngxSelectConfig.virtualization` is set; otherwise identity.
 *   2. **Virtual item count.** Exposed as a signal the variant
 *      templates bind to `[virtualCount]` on their inner
 *      `CngxListbox`. `undefined` in the identity path so
 *      `CngxActiveDescendant` falls back to `resolvedItems.length`.
 *   3. **AD → recycler scroll bridge.** When the renderer has a
 *      virtualiser AND the listbox resolves, keyboard navigation
 *      past the rendered window calls `virtualizer.scrollToIndex`
 *      to bring the active option into view. Equivalent to
 *      {@link /projects/common/data/src/recycler/connect-recycler-active-descendant.ts
 *      connectRecyclerToActiveDescendant} but works off the
 *      variant-level renderer bundle (no raw recycler reference
 *      needed).
 *   4. **Injection context.** The helper calls `inject` /
 *      `injectRecycler` on behalf of the variant — the variant
 *      invokes it in a field initializer exactly like any other
 *      `inject(...)` call.
 *
 * @category interactive
 */
export function setupVirtualization<T, TCommit>(opts: {
  readonly core: CngxSelectCore<T, TCommit>;
  readonly popoverRef: Signal<CngxPopover | undefined>;
  readonly listboxRef: Signal<CngxListbox<unknown> | undefined>;
  readonly virtualization: CngxSelectVirtualizationConfig | null;
}): {
  readonly panelRenderer: PanelRenderer<T>;
  readonly virtualItemCount: Signal<number | undefined>;
} {
  const injected = inject(CNGX_PANEL_RENDERER_FACTORY)<T>({
    flatOptions: opts.core.flatOptions,
  });

  const panelRenderer: PanelRenderer<T> = injected.virtualizer
    ? injected
    : opts.virtualization !== null
      ? createAutoPanelRenderer<T>({
          flatOptions: opts.core.flatOptions,
          popoverRef: opts.popoverRef,
          virtualization: opts.virtualization,
        })
      : injected;

  const virtualItemCount = computed<number | undefined>(() => {
    const total = panelRenderer.totalCount?.();
    return panelRenderer.virtualizer !== undefined ? total : undefined;
  });

  // AD ↔ recycler scroll bridge — only fires when the renderer
  // carries a virtualiser AND the listbox (hence its AD
  // hostDirective) has resolved via viewChild. AD auto-clears its
  // `pendingHighlightState` once the target enters the rendered
  // range, so no explicit clear is needed here.
  effect(() => {
    const v = panelRenderer.virtualizer;
    if (!v) {
      return;
    }
    const lb = opts.listboxRef();
    if (!lb) {
      return;
    }
    const target = lb.ad.pendingHighlight();
    if (target == null) {
      return;
    }
    untracked(() => v.scrollToIndex(target));
  });

  return { panelRenderer, virtualItemCount };
}

// Re-export the compareWith type alias so variants that import this
// helper don't need a second shared-imports line for a tiny type.
export type { CngxSelectCompareFn };
