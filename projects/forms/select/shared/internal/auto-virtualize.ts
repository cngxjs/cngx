import {
  type ElementRef,
  type Signal,
  computed,
  linkedSignal,
} from '@angular/core';

import { type CngxRecycler, injectRecycler } from '@cngx/common/data';
import type { CngxPopover, CngxPopoverPresentation } from '@cngx/common/popover';
import { createSlotRegistry, type SlotRegistry } from '@cngx/core/utils';

import { sameArrayContents } from './compare';
import type { CngxSelectOptionDef } from '../option.model';
import type { PanelRenderer, PanelRendererInput } from '../panel-renderer';
import { createRecyclerPanelRendererFactory } from '../recycler-panel-renderer';
import type { CngxSelectVirtualizationConfig } from '../config';

/**
 * What `cngx-select-panel` needs to own the auto recycler's lifetime: the
 * panel mounts `[cngxSelectAutoRecycler]` once `needed` turns true, and that
 * directive calls `create` in its injection context and registers the result
 * in `slot`.
 *
 * @internal
 */
export interface CngxSelectAutoRecyclerHandle {
  /** Latches once a flat list reaches the threshold. */
  readonly needed: Signal<boolean>;
  /** Injection context required. */
  readonly create: () => CngxRecycler;
  readonly slot: SlotRegistry<CngxRecycler>;
}

/**
 * The config-driven {@link PanelRenderer} plus the handle of the recycler
 * behind it. Creates no recycler itself and needs no injection context: below
 * the threshold, and for a grouped list, no recycler, effect or listener exists.
 *
 * @internal
 */
export function createAutoPanelRenderer<T>(opts: {
  readonly flatOptions: Signal<readonly CngxSelectOptionDef<T>[]>;
  readonly hasGroup: Signal<boolean>;
  readonly popoverRef: Signal<CngxPopover | undefined>;
  readonly virtualization: CngxSelectVirtualizationConfig;
  /** Sheet presentation; outside `'anchored'` the panel shell is the scroller. */
  readonly presentation?: Signal<CngxPopoverPresentation>;
  readonly listboxElement?: Signal<HTMLElement | undefined>;
}): {
  readonly renderer: PanelRenderer<T>;
  readonly autoRecycler: CngxSelectAutoRecyclerHandle;
} {
  // The popover viewChild resolves on first CD; the scroll observer retries via
  // afterNextRender, so a null nativeElement on first call is fine. The
  // observer reads the getter inside its effect, so a presentation flip
  // re-attaches it: the popover scrolls while anchored, the panel shell around
  // the listbox in a sheet (neither the sheet host nor the listbox scrolls).
  const scrollElement: ElementRef<HTMLElement> = {
    get nativeElement(): HTMLElement {
      const inSheet = (opts.presentation?.() ?? 'anchored') !== 'anchored';
      const el = inSheet
        ? opts.listboxElement?.()?.closest<HTMLElement>('.cngx-select-panel-shell')
        : opts.popoverRef()?.elementRef.nativeElement;
      return (el ?? null) as unknown as HTMLElement;
    },
  };

  const vConfig = opts.virtualization;
  const threshold = Math.max(0, vConfig.threshold ?? 0);

  const needed = linkedSignal<boolean, boolean>({
    source: () =>
      threshold <= 0 || (!opts.hasGroup() && opts.flatOptions().length >= threshold),
    computation: (crossed, previous) => crossed || previous?.value === true,
  });

  const create = (): CngxRecycler =>
    injectRecycler({
      scrollElement,
      totalCount: (): number => opts.flatOptions().length,
      // Floor at 1px - a 0/negative estimate would divide the scroll range
      // by zero downstream and explode the computed window.
      estimateSize: Math.max(1, vConfig.estimateSize ?? 32),
      overscan: vConfig.overscan ?? 5,
      scrollDebounce: vConfig.scrollDebounce,
    });

  const slot = createSlotRegistry<CngxRecycler>();

  const input: PanelRendererInput<T> = { flatOptions: opts.flatOptions };
  const buildRenderer = (recycler: CngxRecycler): PanelRenderer<T> =>
    createRecyclerPanelRendererFactory(recycler)<T>(input);
  const recyclerRenderer = computed<PanelRenderer<T> | null>(
    () => {
      const recycler = slot.current();
      return recycler ? buildRenderer(recycler) : null;
    },
    { equal: Object.is },
  );
  const virtualizerSignal = (
    read: (v: NonNullable<PanelRenderer<T>['virtualizer']>) => number,
  ): Signal<number> =>
    computed(() => {
      const v = recyclerRenderer()?.virtualizer;
      return v ? read(v) : 0;
    });

  return {
    renderer: {
      // Follows the live list, not the latch: the full list below the
      // threshold and for a grouped list, the window otherwise, and an empty
      // slice for the one render pass until the panel has mounted the recycler.
      renderOptions: computed<readonly CngxSelectOptionDef<T>[]>(
        () => {
          const all = opts.flatOptions();
          if (all.length < threshold || opts.hasGroup()) {
            return all;
          }
          return recyclerRenderer()?.renderOptions() ?? [];
        },
        // Structural equal - length + per-entry identity. Matches the
        // recycler renderer's equal so the wrapper doesn't cascade.
        { equal: (a, b) => sameArrayContents(a, b, Object.is) },
      ),
      totalCount: computed<number>(() => opts.flatOptions().length),
      virtualizer: {
        startIndex: virtualizerSignal((v) => v.startIndex()),
        offsetBefore: virtualizerSignal((v) => v.offsetBefore()),
        offsetAfter: virtualizerSignal((v) => v.offsetAfter()),
        setsize: virtualizerSignal((v) => v.setsize()),
        rowSizeHint: virtualizerSignal((v) => v.rowSizeHint()),
        scrollToIndex: (index) => slot.current()?.scrollToIndex(index),
      },
    },
    autoRecycler: { needed, create, slot },
  };
}
