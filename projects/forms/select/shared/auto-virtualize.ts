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
 * Resolves the variant's {@link PanelRenderer} from the
 * `CngxSelectConfig.virtualization` entry: identity renderer when null,
 * recycler renderer otherwise, with optional threshold-gated fallback to
 * identity for small lists.
 *
 * Injection context required - calls `injectRecycler` internally.
 *
 * @internal
 */
export function createAutoPanelRenderer<T>(opts: {
  readonly flatOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
  readonly popoverRef: Signal<CngxPopover | undefined>;
  readonly virtualization: CngxSelectVirtualizationConfig | null;
}): PanelRenderer<T> {
  if (opts.virtualization === null) {
    return createIdentityPanelRenderer<T>({ flatOptions: opts.flatOptions });
  }

  // Popover viewChild resolves on first CD; scroll-observer retries via
  // afterNextRender, so a null nativeElement on first call is fine.
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

  // Below threshold: identity render. Above: full recycler. virtualizer
  // stays attached either way; identity-mode signals emit zero.
  return {
    renderOptions: computed<readonly CngxSelectOptionDef<T>[]>(
      () =>
        opts.flatOptions().length < threshold
          ? opts.flatOptions()
          : recyclerRenderer.renderOptions(),
      {
        // Structural equal - length + per-entry identity. Matches the
        // recycler renderer's equal so the wrapper doesn't cascade.
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
    ),
    totalCount: recyclerRenderer.totalCount,
    virtualizer: recyclerRenderer.virtualizer,
  };
}
