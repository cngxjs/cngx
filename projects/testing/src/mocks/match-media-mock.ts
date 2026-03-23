import { vi } from 'vitest';

/** Mock for `window.matchMedia`. */
export interface MatchMediaMock {
  /** Install the mock on the given window object. */
  install: (win: Window) => void;
  /** Trigger a media query change event. */
  trigger: (matches: boolean) => void;
  /** Restore the original matchMedia. */
  restore: (win: Window) => void;
}

/**
 * Creates a mock for `window.matchMedia` that captures the listener
 * and allows programmatic triggering of match changes.
 *
 * @example
 * ```typescript
 * const mock = createMatchMediaMock(true); // initial matches
 * mock.install(window);
 * // ... test code ...
 * mock.trigger(false); // simulate query no longer matching
 * mock.restore(window);
 * ```
 */
export function createMatchMediaMock(initialMatches = false): MatchMediaMock {
  let listener: ((e: MediaQueryListEvent) => void) | null = null;
  let currentMatches = initialMatches;
  let originalMatchMedia: typeof window.matchMedia | null = null;

  const mql = {
    get matches() {
      return currentMatches;
    },
    media: '',
    onchange: null,
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listener = cb;
    }),
    removeEventListener: vi.fn(() => {
      listener = null;
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };

  return {
    install: (win: Window) => {
      originalMatchMedia = win.matchMedia.bind(win);
      win.matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
    },
    trigger: (matches: boolean) => {
      currentMatches = matches;
      listener?.({ matches } as MediaQueryListEvent);
    },
    restore: (win: Window) => {
      if (originalMatchMedia) {
        win.matchMedia = originalMatchMedia;
      }
    },
  };
}
