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
 * Virtualisation wire-up for variants rendering through `CngxSelectPanel`.
 * Resolves the renderer cascade (consumer-supplied → config-driven →
 * identity), surfaces `virtualItemCount`, and installs the AD→recycler
 * `scrollToIndex` bridge. Injection context required.
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

  // AD ↔ recycler scroll bridge. AD auto-clears pendingHighlight once
  // the target enters the rendered range — no explicit clear here.
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

export type { CngxSelectCompareFn };
