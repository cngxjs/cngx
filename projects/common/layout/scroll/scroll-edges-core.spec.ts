import { computed, type DestroyRef } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { createScrollEdges, type ScrollEdgesHost } from './scroll-edges-core';

interface Metrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
}

/** A scrollport whose six metrics are plain mutable fields. */
function makeScrollport(initial: Partial<Metrics> = {}): HTMLElement & Metrics {
  const element = document.createElement('div');
  const metrics: Metrics = {
    scrollTop: 0,
    scrollHeight: 100,
    clientHeight: 100,
    scrollLeft: 0,
    scrollWidth: 100,
    clientWidth: 100,
    ...initial,
  };
  for (const key of Object.keys(metrics) as (keyof Metrics)[]) {
    Object.defineProperty(element, key, {
      get: () => metrics[key],
      set: (value: number) => {
        metrics[key] = value;
      },
      configurable: true,
    });
  }
  return element as HTMLElement & Metrics;
}

/**
 * Fake window surface. The shared `createResizeObserverMock` captures only the
 * most recent callback, so this keeps one callback per observed element to
 * fire a specific child's resize.
 */
function makeHost() {
  const resizeCallbacks = new Map<Element, () => void>();
  const disconnected: Element[] = [];
  let mutationCallback: (() => void) | null = null;
  const mutationDisconnect = vi.fn();
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 1;
  const cancelAnimationFrame = vi.fn((handle: number) => {
    frames.delete(handle);
  });

  class FakeResizeObserver {
    private target: Element | null = null;
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element): void {
      this.target = target;
      resizeCallbacks.set(target, () => this.callback([], this as unknown as ResizeObserver));
    }
    unobserve(): void {
      // not used by observeResize
    }
    disconnect(): void {
      if (this.target) {
        resizeCallbacks.delete(this.target);
        disconnected.push(this.target);
      }
    }
  }

  class FakeMutationObserver {
    constructor(callback: () => void) {
      mutationCallback = callback;
    }
    observe(): void {
      // the callback is fired manually
    }
    disconnect = mutationDisconnect;
    takeRecords(): MutationRecord[] {
      return [];
    }
  }

  const host: ScrollEdgesHost = {
    ResizeObserver: FakeResizeObserver as unknown as typeof ResizeObserver,
    MutationObserver: FakeMutationObserver as unknown as typeof MutationObserver,
    requestAnimationFrame: (callback) => {
      const handle = nextFrame++;
      frames.set(handle, callback);
      return handle;
    },
    cancelAnimationFrame,
  };

  return {
    host,
    resizeCallbacks,
    disconnected,
    mutationDisconnect,
    cancelAnimationFrame,
    pendingFrames: () => frames.size,
    fireMutation: () => mutationCallback?.(),
    flushFrames: () => {
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, callback]) => callback(0));
    },
  };
}

function makeDestroyRef() {
  const callbacks: (() => void)[] = [];
  const destroyRef = {
    onDestroy: (callback: () => void) => {
      callbacks.push(callback);
      return () => undefined;
    },
    destroyed: false,
  } as unknown as DestroyRef;
  return { destroyRef, destroy: () => callbacks.forEach((callback) => callback()) };
}

function edgesOf(state: ReturnType<typeof createScrollEdges>) {
  return {
    blockStart: state.canScrollBlockStart(),
    blockEnd: state.canScrollBlockEnd(),
    inlineStart: state.canScrollInlineStart(),
    inlineEnd: state.canScrollInlineEnd(),
  };
}

describe('createScrollEdges', () => {
  it('starts with every edge false before the first frame', () => {
    const fake = makeHost();
    const element = makeScrollport({ scrollHeight: 400, scrollWidth: 400 });
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);

    expect(edgesOf(state)).toEqual({
      blockStart: false,
      blockEnd: false,
      inlineStart: false,
      inlineEnd: false,
    });
  });

  it('reports the block edges at the top, in the middle and at the bottom', () => {
    const fake = makeHost();
    const element = makeScrollport({ scrollHeight: 400, clientHeight: 100 });
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);

    fake.flushFrames();
    expect(state.canScrollBlockStart()).toBe(false);
    expect(state.canScrollBlockEnd()).toBe(true);

    element.scrollTop = 150;
    element.dispatchEvent(new Event('scroll'));
    fake.flushFrames();
    expect(state.canScrollBlockStart()).toBe(true);
    expect(state.canScrollBlockEnd()).toBe(true);

    element.scrollTop = 300;
    element.dispatchEvent(new Event('scroll'));
    fake.flushFrames();
    expect(state.canScrollBlockStart()).toBe(true);
    expect(state.canScrollBlockEnd()).toBe(false);
  });

  it('treats a 1px distance as the edge and 2px as scrollable', () => {
    const fake = makeHost();
    const element = makeScrollport({ scrollHeight: 101, clientHeight: 100 });
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);
    fake.flushFrames();
    expect(state.canScrollBlockEnd()).toBe(false);

    element.scrollHeight = 102;
    element.dispatchEvent(new Event('scroll'));
    fake.flushFrames();
    expect(state.canScrollBlockEnd()).toBe(true);

    element.scrollTop = 1;
    element.dispatchEvent(new Event('scroll'));
    fake.flushFrames();
    expect(state.canScrollBlockStart()).toBe(false);

    element.scrollTop = 2;
    element.dispatchEvent(new Event('scroll'));
    fake.flushFrames();
    expect(state.canScrollBlockStart()).toBe(true);
  });

  it('maps a negative RTL scrollLeft onto the same start / end as LTR', () => {
    const positions = [
      { ltr: 0, rtl: 0, inlineStart: false, inlineEnd: true },
      { ltr: 150, rtl: -150, inlineStart: true, inlineEnd: true },
      { ltr: 300, rtl: -300, inlineStart: true, inlineEnd: false },
    ];
    for (const position of positions) {
      for (const scrollLeft of [position.ltr, position.rtl]) {
        const fake = makeHost();
        const element = makeScrollport({ scrollWidth: 400, clientWidth: 100, scrollLeft });
        const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);
        fake.flushFrames();
        expect(state.canScrollInlineStart()).toBe(position.inlineStart);
        expect(state.canScrollInlineEnd()).toBe(position.inlineEnd);
      }
    }
  });

  it('flips canScrollBlockEnd when a child resize grows the content', () => {
    const fake = makeHost();
    const element = makeScrollport();
    const child = document.createElement('div');
    element.appendChild(child);
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);
    fake.flushFrames();
    expect(state.canScrollBlockEnd()).toBe(false);

    element.scrollHeight = 300;
    fake.resizeCallbacks.get(child)?.();
    fake.flushFrames();
    expect(state.canScrollBlockEnd()).toBe(true);
  });

  it('observes a child added after creation and counts its resize', () => {
    const fake = makeHost();
    const element = makeScrollport();
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);
    fake.flushFrames();

    const late = document.createElement('div');
    element.appendChild(late);
    fake.fireMutation();
    fake.flushFrames();
    expect(fake.resizeCallbacks.has(late)).toBe(true);

    element.scrollHeight = 300;
    fake.resizeCallbacks.get(late)?.();
    fake.flushFrames();
    expect(state.canScrollBlockEnd()).toBe(true);
  });

  it('tears down the observer of a removed child', () => {
    const fake = makeHost();
    const element = makeScrollport();
    const child = document.createElement('div');
    element.appendChild(child);
    createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);
    expect(fake.resizeCallbacks.has(child)).toBe(true);

    child.remove();
    fake.fireMutation();
    expect(fake.resizeCallbacks.has(child)).toBe(false);
    expect(fake.disconnected).toContain(child);
    expect(fake.resizeCallbacks.has(element)).toBe(true);
  });

  it('coalesces several triggers in one frame into one read', () => {
    const fake = makeHost();
    const element = makeScrollport({ scrollHeight: 400 });
    const child = document.createElement('div');
    element.appendChild(child);
    const reads = vi.fn();
    // scrollWidth is read exactly once per snapshot read.
    Object.defineProperty(element, 'scrollWidth', {
      get: () => {
        reads();
        return 100;
      },
      configurable: true,
    });
    createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);

    element.dispatchEvent(new Event('scroll'));
    fake.resizeCallbacks.get(element)?.();
    fake.resizeCallbacks.get(child)?.();
    fake.fireMutation();
    element.dispatchEvent(new Event('scroll'));
    expect(fake.pendingFrames()).toBe(1);

    fake.flushFrames();
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it('keeps the projections quiet while no edge flips', () => {
    const fake = makeHost();
    const element = makeScrollport({ scrollHeight: 400 });
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, fake.host);
    fake.flushFrames();
    let runs = 0;
    const consumer = computed(() => {
      runs++;
      return state.canScrollBlockEnd();
    });
    expect(consumer()).toBe(true);

    element.scrollTop = 0;
    element.dispatchEvent(new Event('scroll'));
    fake.flushFrames();
    expect(consumer()).toBe(true);
    expect(runs).toBe(1);
  });

  it('reads synchronously on a host without requestAnimationFrame', () => {
    const fake = makeHost();
    const host: ScrollEdgesHost = {
      ResizeObserver: fake.host.ResizeObserver,
      MutationObserver: fake.host.MutationObserver,
    };
    const element = makeScrollport({ scrollHeight: 400 });
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, host);
    expect(state.canScrollBlockEnd()).toBe(true);
  });

  it('removes the listener, disconnects, cancels the frame and ignores a late frame on destroy', () => {
    const fake = makeHost();
    const element = makeScrollport({ scrollHeight: 400 });
    const child = document.createElement('div');
    element.appendChild(child);
    const removeListener = vi.spyOn(element, 'removeEventListener');
    const { destroyRef, destroy } = makeDestroyRef();
    const state = createScrollEdges(element, destroyRef, fake.host);
    expect(fake.pendingFrames()).toBe(1);

    destroy();

    expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(fake.mutationDisconnect).toHaveBeenCalled();
    expect(fake.resizeCallbacks.size).toBe(0);
    expect(fake.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(fake.pendingFrames()).toBe(0);

    element.dispatchEvent(new Event('scroll'));
    expect(fake.pendingFrames()).toBe(0);
    expect(state.canScrollBlockEnd()).toBe(false);
  });

  it('does not write when a frame scheduled before destroy still runs', () => {
    const fake = makeHost();
    const host: ScrollEdgesHost = { ...fake.host, cancelAnimationFrame: undefined };
    const element = makeScrollport({ scrollHeight: 400 });
    const { destroyRef, destroy } = makeDestroyRef();
    const state = createScrollEdges(element, destroyRef, host);

    destroy();
    fake.flushFrames();
    expect(state.canScrollBlockEnd()).toBe(false);
  });

  it('wires nothing and stays false on a null host', () => {
    const element = makeScrollport({ scrollHeight: 400, scrollWidth: 400 });
    const addListener = vi.spyOn(element, 'addEventListener');
    const state = createScrollEdges(element, makeDestroyRef().destroyRef, null);

    element.dispatchEvent(new Event('scroll'));
    expect(addListener).not.toHaveBeenCalled();
    expect(edgesOf(state)).toEqual({
      blockStart: false,
      blockEnd: false,
      inlineStart: false,
      inlineEnd: false,
    });
  });
});
