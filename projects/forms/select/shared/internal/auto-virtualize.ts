import {
  type ElementRef,
  type Signal,
  DestroyRef,
  Injector,
  afterEveryRender,
  afterNextRender,
  computed,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';

import { type CngxRecycler, injectRecycler } from '@cngx/common/data';
import { observeResize } from '@cngx/common/layout';
import type { CngxPopover, CngxPopoverPresentation } from '@cngx/common/popover';
import { createSlotRegistry, type SlotRegistry } from '@cngx/core/utils';

import { sameArrayContents } from './compare';
import type { CngxSelectOptionDef } from '../option.model';
import type { PanelRenderer, PanelRendererInput } from '../panel-renderer';
import { createRecyclerPanelRendererFactory } from '../recycler-panel-renderer';
import type { CngxSelectVirtualizationConfig } from '../config';

/** Row estimate until the first option row is measured. */
const FALLBACK_ROW_SIZE = 32;

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

  const create = (): CngxRecycler => {
    // One measured option row drives the uniform estimate: row height follows
    // the touch-target axis, density, text scale and consumer tokens, and a
    // fixed guess under-counts the unrendered rest, so a jump to the end grows
    // the list under the applied scroll. An explicit consumer estimate wins.
    const measured = signal<number | null>(null);
    const recycler = injectRecycler({
      scrollElement,
      totalCount: (): number => opts.flatOptions().length,
      // Floor at 1px - a 0/negative estimate would divide the scroll range
      // by zero downstream and explode the computed window.
      estimateSize: computed(() =>
        Math.max(1, vConfig.estimateSize ?? measured() ?? FALLBACK_ROW_SIZE),
      ),
      overscan: vConfig.overscan ?? 5,
      scrollDebounce: vConfig.scrollDebounce,
    });
    if (vConfig.estimateSize === undefined) {
      const injector = inject(Injector);
      // A new row height moves every offset by the same factor, so scaling
      // scrollTop keeps the same row at the top: an open scroll applied at the
      // old estimate, and a density or text-scale flip while scrolled. Exact
      // because the select never calls recycler.measure(): item tops stay
      // i * estimate. The write waits for the render that resizes the spacers,
      // otherwise a grown target clamps to the old scroll height.
      const write = (height: number): void => {
        const previous = untracked(measured) ?? FALLBACK_ROW_SIZE;
        if (!(height > 0) || height === untracked(measured)) {
          return;
        }
        measured.set(height);
        const el = scrollElement.nativeElement;
        const top = el?.scrollTop ?? 0;
        if (!el || top === 0 || height === previous) {
          return;
        }
        afterNextRender(
          {
            write: () => {
              // A scroll in between (the active-descendant rAF scroll, the
              // user) already set a fresh position; the scaled one is stale.
              if (el.scrollTop !== top) {
                return;
              }
              el.scrollTop = (top * height) / previous;
            },
          },
          { injector },
        );
      };
      // Every render, not a tracked effect: the window signals derive from the
      // estimate this probe writes, so tracking them would re-run the probe on
      // its own write. The observer follows the first row node and is only
      // replaced when a window move puts a different node first.
      let observed: HTMLElement | null = null;
      let stopObserving: (() => void) | null = null;
      const release = (): void => {
        stopObserving?.();
        stopObserving = null;
        observed = null;
      };
      afterEveryRender({
        read: () => {
          const row =
            scrollElement.nativeElement?.querySelector<HTMLElement>('[data-cngx-recycle-index]') ??
            null;
          if (row === observed) {
            return;
          }
          release();
          if (!row) {
            return;
          }
          observed = row;
          // Synchronous first write: the active-descendant scroll runs in a
          // requestAnimationFrame, before ResizeObserver delivery in a frame.
          write(row.getBoundingClientRect().height);
          stopObserving = observeResize(row.ownerDocument.defaultView, row, 'border-box', (entry) =>
            write(entry.borderBoxSize?.[0]?.blockSize ?? row.getBoundingClientRect().height),
          );
        },
      });
      inject(DestroyRef).onDestroy(release);
    }
    return recycler;
  };

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
