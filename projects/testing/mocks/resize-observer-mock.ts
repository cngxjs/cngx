import { vi } from 'vitest';

/** Mock for the `ResizeObserver` browser API. */
export interface ResizeObserverMock {
  /** Install the mock on the given window object. */
  install: (win: Window) => void;
  /** Trigger a resize callback with a partial entry. */
  triggerResize: (entry: Partial<ResizeObserverEntry>) => void;
  /** The observe spy. */
  observe: ReturnType<typeof vi.fn>;
  /** The disconnect spy. */
  disconnect: ReturnType<typeof vi.fn>;
  /** Restore the original ResizeObserver. */
  restore: (win: Window) => void;
}

/**
 * Creates a mock for `ResizeObserver` that captures the callback
 * and allows programmatic triggering of resize events.
 *
 * @example
 * ```typescript
 * const mock = createResizeObserverMock();
 * mock.install(window);
 * // ... create directive ...
 * mock.triggerResize({ contentRect: { width: 500, height: 300 } as DOMRectReadOnly });
 * mock.restore(window);
 * ```
 */
export function createResizeObserverMock(): ResizeObserverMock {
  let callback: ResizeObserverCallback | null = null;
  let originalRO: typeof ResizeObserver | null = null;

  const observe = vi.fn();
  const disconnect = vi.fn();

  return {
    install(win: Window & { ResizeObserver?: typeof ResizeObserver }) {
      originalRO = win.ResizeObserver ?? null;
      win.ResizeObserver = class MockResizeObserver {
        constructor(cb: ResizeObserverCallback) {
          callback = cb;
        }
        observe = observe;
        unobserve = vi.fn();
        disconnect = disconnect;
      } as unknown as typeof ResizeObserver;
    },
    triggerResize(entry: Partial<ResizeObserverEntry>) {
      callback?.([entry as ResizeObserverEntry], null!);
    },
    observe,
    disconnect,
    restore(win: Window & { ResizeObserver?: typeof ResizeObserver }) {
      if (originalRO) {
        win.ResizeObserver = originalRO;
      }
    },
  };
}
