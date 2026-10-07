import { computed, type DestroyRef, signal, type Signal } from '@angular/core';

import { observeResize, type ResizeObserverHost } from '../observers/resize-signal';

/**
 * Structural window surface `createScrollEdges` reads: `window`, `globalThis`,
 * or a test double. Every member is optional so SSR and jsdom hosts pass the
 * type and fall back at runtime: no `ResizeObserver` means no resize
 * tracking, no `MutationObserver` means the child set is captured once, no
 * `requestAnimationFrame` means every trigger reads synchronously.
 *
 * @category common/layout
 * @since 0.1.0
 */
export interface ScrollEdgesHost extends ResizeObserverHost {
  MutationObserver?: typeof MutationObserver;
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame?: (handle: number) => void;
}

/**
 * Per-edge scroll state of one scrollport. Each signal is `true` while content
 * is hidden toward that edge, i.e. while the user can still scroll toward it.
 *
 * @category common/layout
 * @since 0.1.0
 */
export interface CngxScrollEdgesState {
  /** Content is hidden above (toward the block-start edge). */
  readonly canScrollBlockStart: Signal<boolean>;
  /** Content is hidden below (toward the block-end edge). */
  readonly canScrollBlockEnd: Signal<boolean>;
  /** Content is hidden toward the inline-start edge (left in LTR, right in RTL). */
  readonly canScrollInlineStart: Signal<boolean>;
  /** Content is hidden toward the inline-end edge (right in LTR, left in RTL). */
  readonly canScrollInlineEnd: Signal<boolean>;
}

interface ScrollEdgesSnapshot {
  readonly blockStart: boolean;
  readonly blockEnd: boolean;
  readonly inlineStart: boolean;
  readonly inlineEnd: boolean;
}

/** Distances up to this many px count as "at the edge" (sub-pixel and zoom rounding). */
const EDGE_TOLERANCE = 1;

const NO_EDGES: ScrollEdgesSnapshot = {
  blockStart: false,
  blockEnd: false,
  inlineStart: false,
  inlineEnd: false,
};

function sameEdges(a: ScrollEdgesSnapshot, b: ScrollEdgesSnapshot): boolean {
  return (
    a.blockStart === b.blockStart &&
    a.blockEnd === b.blockEnd &&
    a.inlineStart === b.inlineStart &&
    a.inlineEnd === b.inlineEnd
  );
}

/**
 * One read of the six scroll metrics. RTL `scrollLeft` runs over `[-max, 0]`
 * in every evergreen engine and LTR over `[0, max]`, so its magnitude is the
 * distance from the inline-start edge in both directions - no direction lookup
 * and no `getComputedStyle` in the scroll path.
 */
function readEdges(element: HTMLElement): ScrollEdgesSnapshot {
  const inlineOffset = Math.abs(element.scrollLeft);
  return {
    blockStart: element.scrollTop > EDGE_TOLERANCE,
    blockEnd: element.scrollHeight - element.clientHeight - element.scrollTop > EDGE_TOLERANCE,
    inlineStart: inlineOffset > EDGE_TOLERANCE,
    inlineEnd: element.scrollWidth - element.clientWidth - inlineOffset > EDGE_TOLERANCE,
  };
}

/**
 * Tracks which edges of a scrollport still hide content, as four boolean
 * signals.
 *
 * Triggers are a passive `scroll` listener, one `observeResize` per observed
 * element (the scrollport itself plus every direct element child) and a
 * `childList`-only `MutationObserver` that keeps that child set current. All
 * of them only schedule work: the metrics are read once per animation frame
 * however many triggers fired, and the result lands in one snapshot signal
 * with a structural `equal`, so the four projections only notify when an edge
 * actually flips. A distance of 1px or less counts as "at the edge".
 *
 * Only direct children are resize-observed. A long item list should sit inside
 * one content element rather than be N direct children (one observer each);
 * growth deep inside a fixed-size child is picked up on the next scroll.
 *
 * A `null` host (SSR) wires nothing and all four signals stay `false`.
 *
 * ```typescript
 * const edges = createScrollEdges(
 *   inject(ElementRef).nativeElement,
 *   inject(DestroyRef),
 *   inject(DOCUMENT).defaultView,
 * );
 * const showTopShadow = edges.canScrollBlockStart;
 * ```
 *
 * @param element The scrollport to read.
 * @param destroyRef Scope whose destruction removes the listener, disconnects
 *   every observer and cancels a pending frame.
 * @param host The window-like object to read the observer and frame APIs from.
 * @returns The four per-edge signals.
 * @category common/layout
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/scroll/scroll-edges-core.ts
 * @since 0.1.0
 * @relatedTo CngxScrollEdges, observeResize
 */
export function createScrollEdges(
  element: HTMLElement,
  destroyRef: DestroyRef,
  host: ScrollEdgesHost | null | undefined,
): CngxScrollEdgesState {
  const edges = signal<ScrollEdgesSnapshot>(NO_EDGES, { equal: sameEdges });
  const state: CngxScrollEdgesState = {
    canScrollBlockStart: computed(() => edges().blockStart),
    canScrollBlockEnd: computed(() => edges().blockEnd),
    canScrollInlineStart: computed(() => edges().inlineStart),
    canScrollInlineEnd: computed(() => edges().inlineEnd),
  };

  if (!host) {
    return state;
  }

  let destroyed = false;
  let framePending = false;
  let frameHandle = 0;

  const read = (): void => {
    framePending = false;
    if (destroyed) {
      return;
    }
    edges.set(readEdges(element));
  };

  const schedule = (): void => {
    if (destroyed || framePending) {
      return;
    }
    if (typeof host.requestAnimationFrame !== 'function') {
      read();
      return;
    }
    framePending = true;
    frameHandle = host.requestAnimationFrame(read);
  };

  const resizeTeardowns = new Map<Element, () => void>();
  const observe = (target: Element): void => {
    if (resizeTeardowns.has(target)) {
      return;
    }
    resizeTeardowns.set(
      target,
      observeResize(host, target, 'border-box', () => schedule()),
    );
  };
  const syncChildren = (): void => {
    const children = new Set<Element>(Array.from(element.children));
    for (const [target, teardown] of resizeTeardowns) {
      if (target !== element && !children.has(target)) {
        teardown();
        resizeTeardowns.delete(target);
      }
    }
    children.forEach(observe);
  };

  element.addEventListener('scroll', schedule, { passive: true });
  observe(element);
  syncChildren();

  let mutationObserver: MutationObserver | null = null;
  if (typeof host.MutationObserver === 'function') {
    mutationObserver = new host.MutationObserver(() => {
      syncChildren();
      schedule();
    });
    mutationObserver.observe(element, { childList: true });
  }

  schedule();

  destroyRef.onDestroy(() => {
    destroyed = true;
    element.removeEventListener('scroll', schedule);
    mutationObserver?.disconnect();
    resizeTeardowns.forEach((teardown) => teardown());
    resizeTeardowns.clear();
    if (framePending && typeof host.cancelAnimationFrame === 'function') {
      host.cancelAnimationFrame(frameHandle);
    }
    framePending = false;
  });

  return state;
}
