import { vi } from 'vitest';

/** Mock for `window.matchMedia`. */
export interface MatchMediaMock {
  /** Install the mock on the given window object. */
  install: (win: Window) => void;
  /**
   * Trigger a media query change event. Scoped to one query when given,
   * otherwise every query handed out so far changes.
   */
  trigger: (matches: boolean, query?: string) => void;
  /** Restore the original matchMedia. */
  restore: (win: Window) => void;
}

interface QueryState {
  matches: boolean;
  listeners: Set<(e: MediaQueryListEvent) => void>;
}

/**
 * Creates a mock for `window.matchMedia` that keys listeners per query
 * and allows programmatic triggering of match changes.
 *
 * ```typescript
 * const mock = createMatchMediaMock(true); // initial matches
 * mock.install(window);
 * // ... test code ...
 * mock.trigger(false); // simulate query no longer matching
 * mock.restore(window);
 * ```
 */
export function createMatchMediaMock(initialMatches = false): MatchMediaMock {
  const queries = new Map<string, QueryState>();
  let originalMatchMedia: typeof window.matchMedia | null = null;

  function stateFor(query: string): QueryState {
    let state = queries.get(query);
    if (!state) {
      state = { matches: initialMatches, listeners: new Set() };
      queries.set(query, state);
    }
    return state;
  }

  function createMql(query: string): MediaQueryList {
    const state = stateFor(query);
    const add = (cb: (e: MediaQueryListEvent) => void) => {
      state.listeners.add(cb);
    };
    const remove = (cb: (e: MediaQueryListEvent) => void) => {
      state.listeners.delete(cb);
    };
    return {
      get matches() {
        return state.matches;
      },
      media: query,
      onchange: null,
      addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => add(cb)),
      removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) =>
        remove(cb),
      ),
      // Deprecated pair routed onto the same list so trigger() fires them too.
      addListener: vi.fn(add),
      removeListener: vi.fn(remove),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;
  }

  return {
    install(win: Window) {
      // jsdom ships no matchMedia; tolerate the absence instead of binding it.
      originalMatchMedia = typeof win.matchMedia === 'function' ? win.matchMedia.bind(win) : null;
      // stubGlobal keeps the mock inside vitest-setup's unstubAllGlobals net;
      // a direct assignment would survive into later spec files sharing the
      // worker (the builder runs with isolate: false).
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => createMql(query)),
      );
    },
    trigger(matches: boolean, query?: string) {
      const targets =
        query === undefined ? [...queries.entries()] : ([[query, stateFor(query)]] as const);
      for (const [media, state] of targets) {
        state.matches = matches;
        for (const cb of [...state.listeners]) {
          cb({ matches, media } as MediaQueryListEvent);
        }
      }
    },
    restore(win: Window) {
      if (originalMatchMedia) {
        vi.stubGlobal('matchMedia', originalMatchMedia);
      } else {
        // No original existed: restoring means removing the property.
        delete (win as { matchMedia?: typeof window.matchMedia }).matchMedia;
      }
    },
  };
}
