import { type ElementRef, type Signal, computed } from '@angular/core';

import { injectRecycler } from '@cngx/common/data';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxSelectOptionDef } from './option.model';
import {
  createIdentityPanelRenderer,
  type PanelRenderer,
  type PanelRendererInput,
} from './panel-renderer';
import { createRecyclerPanelRendererFactory } from './recycler-panel-renderer';
import type { CngxSelectVirtualizationConfig } from './config';

/**
 * Build the variant's effective {@link PanelRenderer} based on the
 * resolved `CngxSelectConfig.virtualization` entry. Wraps the four
 * concerns each select-family variant used to handle ad-hoc:
 *
 *   1. Identity rendering when virtualization is absent.
 *   2. Recycler construction with sensible defaults + tuning merge.
 *   3. Lazy `scrollElement` resolution via the variant's
 *      `popoverRef` viewChild (null-safe — scroll-observer retries
 *      `afterNextRender`).
 *   4. Threshold skip: when `totalCount` is below
 *      `virtualization.threshold`, renderer short-circuits to
 *      identity to avoid spacer-div overhead on naturally-small
 *      lists (follow-up potential — today threshold is purely
 *      documentation; the recycler handles small lists fine).
 *
 * **Must run in an injection context.** Calls `injectRecycler`
 * internally when virtualization is enabled; the recycler's
 * `DestroyRef` / `DOCUMENT` injections follow the calling variant's
 * lifecycle.
 *
 * @category interactive
 */
export function createAutoPanelRenderer<T>(opts: {
  readonly flatOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
  readonly popoverRef: Signal<CngxPopover | undefined>;
  readonly virtualization: CngxSelectVirtualizationConfig | null;
}): PanelRenderer<T> {
  if (opts.virtualization === null) {
    return createIdentityPanelRenderer<T>({ flatOptions: opts.flatOptions });
  }

  // Lazy-getter ElementRef — the popover viewChild resolves during
  // first CD; scroll-observer retries via `afterNextRender` so
  // `nativeElement === null` at first call is safe.
  const scrollElement: ElementRef<HTMLElement> = {
    get nativeElement(): HTMLElement {
      const el = opts.popoverRef()?.elementRef.nativeElement;
      return (el ?? null) as unknown as HTMLElement;
    },
  };

  const vConfig = opts.virtualization;
  const recycler = injectRecycler({
    scrollElement,
    totalCount: (): number => opts.flatOptions().length,
    estimateSize: vConfig.estimateSize ?? 32,
    overscan: vConfig.overscan ?? 5,
    scrollDebounce: vConfig.scrollDebounce,
    skeletonDelay: vConfig.skeletonDelay,
  });

  const input: PanelRendererInput<T> = { flatOptions: opts.flatOptions };
  const recyclerRenderer = createRecyclerPanelRendererFactory(recycler)<T>(input);

  const threshold = Math.max(0, vConfig.threshold ?? 0);
  if (threshold <= 0) {
    return recyclerRenderer;
  }

  // Threshold-gated renderer — below the threshold, fall back to
  // identity rendering (no spacers, no windowing). Above, full
  // recycler. `renderOptions` / `totalCount` switch reactively; the
  // `virtualizer` bundle stays attached so the panel template keeps
  // a single wiring — its internal signals (offsetBefore etc.) just
  // return zero while identity mode is active.
  return {
    renderOptions: computed<readonly CngxSelectOptionDef<T>[]>(() =>
      opts.flatOptions().length < threshold
        ? opts.flatOptions()
        : recyclerRenderer.renderOptions(),
    ),
    totalCount: recyclerRenderer.totalCount,
    virtualizer: recyclerRenderer.virtualizer,
  };
}
