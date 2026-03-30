// Step 3: recycler.ts — injectRecycler() factory, CngxRecycler interface, RecyclerConfig

import {
  DestroyRef,
  type ElementRef,
  InjectionToken,
  type Signal,
  computed,
  effect,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { createTransitionTracker } from '@cngx/core/utils';

import { computeRange } from './range-computer';
import { createScrollObserver } from './scroll-observer';

// ── I18n Token ──────────────────────────────────────────────

/**
 * I18n interface for recycler SR announcements.
 * All methods return the announcement text. No hardcoded strings.
 *
 * @category recycler
 */
export interface RecyclerI18n {
  /** Announced when new items are loaded (infinite scroll). */
  loaded(newCount: number, total: number): string;
  /** Announced when filter/search results change. */
  filtered(count: number): string;
  /** Announced when the list becomes empty. */
  empty(): string;
  /** Announced when loading fails. */
  error(): string;
}

/**
 * Injection token for recycler SR announcement texts.
 * Provides English defaults via factory. Override with `provideRecyclerI18n()`.
 *
 * @category recycler
 */
export const CNGX_RECYCLER_I18N = new InjectionToken<RecyclerI18n>(
  'CngxRecyclerI18n',
  {
    factory: (): RecyclerI18n => ({
      loaded: (n, t) => `${n} more items loaded. ${t} total.`,
      filtered: (c) => `${c} results found.`,
      empty: () => 'No results.',
      error: () => 'Error loading data.',
    }),
  },
);

/**
 * Provider function for custom recycler i18n texts.
 *
 * ```typescript
 * providers: [provideRecyclerI18n({
 *   loaded: (n, t) => `${n} weitere Einträge. ${t} gesamt.`,
 *   filtered: (c) => `${c} Ergebnisse.`,
 *   empty: () => 'Keine Ergebnisse.',
 *   error: () => 'Fehler beim Laden.',
 * })]
 * ```
 *
 * @category recycler
 */
export function provideRecyclerI18n(i18n: RecyclerI18n) {
  return { provide: CNGX_RECYCLER_I18N, useValue: i18n };
}

// ── Config ──────────────────────────────────────────────────

/**
 * Configuration for {@link injectRecycler}.
 *
 * @category recycler
 */
export interface RecyclerConfig {
  /** Scroll container. CSS selector, native element, or `ElementRef`. */
  scrollElement: ElementRef | HTMLElement | string;

  /**
   * Total number of items. Reactive — changes on infinite scroll.
   *
   * **Important:** For infinite scroll, this is the number of *loaded* items,
   * not the server-side total. Otherwise the sentinel becomes unreachable.
   */
  totalCount: () => number;

  /** Estimated height per item (px). Number or function per index. */
  estimateSize: number | ((index: number) => number);

  /** Extra items to render above/below the viewport. Default: 5. */
  overscan?: number;

  /**
   * Layout mode. `'list'` (default) uses padding spacers.
   * `'grid'` is Phase 3 — passing it logs a dev-mode warning and falls back to `'list'`.
   */
  layout?: 'list' | 'grid';

  /** Column count for grid mode. Phase 3 — ignored in Phase 1. */
  columns?: number | (() => number);

  /** Debounce for scroll events in ms. Default: 16 (~1 frame). */
  scrollDebounce?: number;

  /**
   * Delay before skeletons are shown (ms). Default: 0.
   * E.g. 300 means `showSkeleton` only becomes `true` after 300ms —
   * fast loads (< 300ms) never show a skeleton.
   */
  skeletonDelay?: number;

  /**
   * Async state source. When set, the recycler derives skeleton rendering,
   * refresh state, and empty state from it — same convention as
   * `CngxCardGrid`, `CngxTreetable`, `CngxPopoverPanel`, and `CngxDialog`.
   */
  state?: CngxAsyncState<unknown>;

  /**
   * Server-side total for A11y (`aria-setsize`) and "Showing X of Y" display.
   * When not set, `totalCount` is used.
   */
  serverTotal?: () => number;
}

// ── Return Interface ────────────────────────────────────────

/**
 * Signal-based virtualizer returned by {@link injectRecycler}.
 * All derived values are `computed()` — the system cannot become inconsistent.
 *
 * @category recycler
 */
export interface CngxRecycler {
  // ── Visible window (with overscan) ────────────────────
  readonly start: Signal<number>;
  readonly end: Signal<number>;

  // ── Layout stabilization ──────────────────────────────
  readonly offsetBefore: Signal<number>;
  readonly offsetAfter: Signal<number>;
  readonly totalSize: Signal<number>;

  // ── Grid mode (Phase 3 — always 0 in Phase 1) ────────
  readonly placeholdersBefore: Signal<number>;
  readonly placeholdersAfter: Signal<number>;

  // ── Async state ───────────────────────────────────────
  readonly isLoading: Signal<boolean>;
  readonly isRefreshing: Signal<boolean>;
  readonly isEmpty: Signal<boolean>;
  readonly skeletonSlots: Signal<number>;
  readonly showSkeleton: Signal<boolean>;

  // ── Visibility (without overscan) ─────────────────────
  readonly firstVisible: Signal<number>;
  readonly lastVisible: Signal<number>;
  readonly visibleCount: Signal<number>;

  // ── Scroll stability (Phase 2 — no-op in Phase 1) ────
  anchorTo(index: number): void;
  releaseAnchor(): void;

  // ── Focus preservation (Phase 2 — null in Phase 1) ────
  readonly lostFocus: Signal<{ index: number } | null>;

  // ── SR communication ──────────────────────────────────
  readonly announcement: Signal<string>;

  // ── A11y ──────────────────────────────────────────────
  readonly ariaSetSize: Signal<number>;

  // ── Convenience ───────────────────────────────────────
  /**
   * Creates a `computed()` slicing items to the visible range.
   * **Call once in a field initializer** — each call creates a new computed node.
   * Do NOT call in templates or methods.
   */
  sliced<T>(items: Signal<T[]>): Signal<T[]>;
  measure(index: number, element: HTMLElement): void;
  scrollToIndex(index: number, behavior?: ScrollBehavior): void;
  reset(): void;
}

// ── Delayed flag (inline createVisibilityTimer equivalent) ──

// Inline equivalent of createVisibilityTimer from @cngx/ui/feedback (Level 4, not importable).
// The flag.set() calls inside the effect are timer-driven side effects, not derived state —
// same pattern accepted in createVisibilityTimer for CngxLoadingOverlay.
function createDelayedFlag(source: Signal<boolean>, delayMs: number): Signal<boolean> {
  if (delayMs <= 0) {
    return source;
  }
  const flag = signal(false);
  effect((onCleanup) => {
    const active = source();
    if (active) {
      const timer = setTimeout(() => flag.set(true), delayMs);
      onCleanup(() => {
        clearTimeout(timer);
        flag.set(false);
      });
    } else {
      flag.set(false);
    }
  });
  return flag.asReadonly();
}

// ── Factory ─────────────────────────────────────────────────

/**
 * Creates a Signal-based virtualizer for DOM recycling.
 *
 * Must be called in an injection context (field initializer or constructor).
 * Internally injects `DestroyRef` and `DOCUMENT` for cleanup and selector resolution.
 *
 * @usageNotes
 *
 * ### Basic list
 * ```typescript
 * readonly recycler = injectRecycler({
 *   scrollElement: '.scroll-container',
 *   totalCount: () => this.items().length,
 *   estimateSize: 48,
 * });
 * readonly visibleItems = this.recycler.sliced(this.items);
 * ```
 *
 * ### With async state
 * ```typescript
 * readonly state = injectAsyncState(() => this.api.getAll());
 * readonly recycler = injectRecycler({
 *   scrollElement: '.scroll-container',
 *   totalCount: () => (this.state.data() ?? []).length,
 *   estimateSize: 64,
 *   state: this.state,
 * });
 * ```
 *
 * @category recycler
 */
export function injectRecycler(config: RecyclerConfig): CngxRecycler {
  const destroyRef = inject(DestroyRef);
  const i18n = inject(CNGX_RECYCLER_I18N);
  const overscan = config.overscan ?? 5;

  // Phase 1: warn about known limitations
  if (config.layout === 'grid' && isDevMode()) {
    console.warn(
      '[CngxRecycler] layout: "grid" is not yet supported (Phase 3). Falling back to "list".',
    );
  }

  if (typeof config.estimateSize === 'function' && isDevMode()) {
    const count = config.totalCount();
    if (count > 10_000) {
      console.warn(
        `[CngxRecycler] estimateSize as a function with ${count} items has O(n) ` +
        `per-frame cost. Consider using a fixed estimateSize for large datasets ` +
        `or wait for Phase 2 SizeCache.`,
      );
    }
  }

  // ── Scroll observer (lazy DOM resolution inside effect) ──
  const scrollState = createScrollObserver(config.scrollElement, destroyRef);

  // ── Range computation ──
  const range = computed(() =>
    computeRange(
      scrollState.scrollTop(),
      scrollState.clientHeight(),
      config.totalCount(),
      config.estimateSize,
      overscan,
    ),
  );

  const start = computed(() => range().start);
  const end = computed(() => range().end);
  const offsetBefore = computed(() => range().offsetBefore);
  const offsetAfter = computed(() => range().offsetAfter);
  const totalSize = computed(() => range().totalSize);

  // ── Grid mode stubs (Phase 3) ──
  const zero = signal(0).asReadonly();

  // ── Visibility without overscan ──
  // start/end include overscan. firstVisible/lastVisible strip it back
  // to reflect the items actually in the viewport.
  const firstVisible = computed(() => {
    const total = config.totalCount();
    if (total === 0) {
      return 0;
    }
    // When totalCount is small enough that all items fit, start is 0
    // and overscan doesn't extend beyond the list — use start directly.
    return Math.min(start() + overscan, total - 1);
  });

  const lastVisible = computed(() => {
    const total = config.totalCount();
    if (total === 0) {
      return 0;
    }
    return Math.min(Math.max(0, end() - overscan - 1), total - 1);
  });

  const visibleCount = computed(() => {
    const total = config.totalCount();
    if (total === 0) {
      return 0;
    }
    return Math.max(0, lastVisible() - firstVisible() + 1);
  });

  // ── Async state ──
  const state = config.state;
  const isLoading = computed(() => state?.isFirstLoad() ?? false);
  const isRefreshing = computed(() => state?.isRefreshing() ?? false);

  const isEmpty = computed(() => {
    if (state?.isBusy()) {
      return false;
    }
    return config.totalCount() === 0;
  });

  const resolvedEstimateSize = typeof config.estimateSize === 'number'
    ? config.estimateSize
    : config.estimateSize(0);

  const skeletonSlots = computed(() => {
    const ch = scrollState.clientHeight();
    if (ch <= 0) {
      return 0;
    }
    return Math.ceil(ch / resolvedEstimateSize);
  });

  const showSkeleton = createDelayedFlag(isLoading, config.skeletonDelay ?? 0);

  // ── SR communication ──
  // previousTotal is a signal, not a mutable let — reactive, no stale-value risk.
  const announcementState = signal('');
  const previousTotal = signal(config.totalCount());

  if (state) {
    const tracker = createTransitionTracker(() => state.status());

    effect(() => {
      const current = tracker.current();
      const previous = tracker.previous();
      const total = config.totalCount();
      const prevTotal = previousTotal();

      // Transition-only — never announce on initial idle
      if (previous === current) {
        return;
      }

      if (current === 'success' && (previous === 'loading' || previous === 'refreshing')) {
        const diff = total - prevTotal;
        if (diff > 0) {
          announcementState.set(i18n.loaded(diff, total));
        } else {
          announcementState.set(i18n.filtered(total));
        }
      } else if (current === 'error') {
        announcementState.set(i18n.error());
      } else if (current === 'success' && total === 0) {
        announcementState.set(i18n.empty());
      }

      previousTotal.set(total);
    });
  } else {
    // Without async state, track totalCount changes for infinite scroll announcements
    effect(() => {
      const total = config.totalCount();
      const prevTotal = previousTotal();
      const diff = total - prevTotal;

      if (prevTotal > 0 && diff > 0) {
        announcementState.set(i18n.loaded(diff, total));
      } else if (prevTotal > 0 && total === 0) {
        announcementState.set(i18n.empty());
      }

      previousTotal.set(total);
    });
  }

  // ── A11y ──
  const ariaSetSize = computed(() => config.serverTotal?.() ?? config.totalCount());

  // ── Focus preservation stub (Phase 2) ──
  const lostFocusSignal = signal<{ index: number } | null>(null).asReadonly();

  return {
    start,
    end,
    offsetBefore,
    offsetAfter,
    totalSize,

    placeholdersBefore: zero,
    placeholdersAfter: zero,

    isLoading,
    isRefreshing,
    isEmpty,
    skeletonSlots,
    showSkeleton,

    firstVisible,
    lastVisible,
    visibleCount,

    anchorTo(_index: number): void {
      if (isDevMode()) {
        console.warn('[CngxRecycler] anchorTo() is not yet implemented (Phase 2).');
      }
    },

    releaseAnchor(): void {
      if (isDevMode()) {
        console.warn('[CngxRecycler] releaseAnchor() is not yet implemented (Phase 2).');
      }
    },

    lostFocus: lostFocusSignal,

    announcement: announcementState.asReadonly(),

    ariaSetSize,

    sliced<T>(items: Signal<T[]>): Signal<T[]> {
      return computed(() => items().slice(start(), end()));
    },

    measure(_index: number, _element: HTMLElement): void {
      if (isDevMode()) {
        console.warn('[CngxRecycler] measure() is not yet implemented (Phase 2).');
      }
    },

    scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
      const el = scrollState.element();
      if (!el) {
        return;
      }
      let targetScrollTop: number;
      if (typeof config.estimateSize === 'number') {
        targetScrollTop = index * config.estimateSize;
      } else {
        // Accumulate estimated heights up to the target index (best-effort).
        // Phase 2 SizeCache will use measured heights for accuracy.
        targetScrollTop = 0;
        for (let i = 0; i < index; i++) {
          targetScrollTop += config.estimateSize(i);
        }
      }

      el.scrollTo({ top: targetScrollTop, behavior });
    },

    reset(): void {
      const el = scrollState.element();
      if (el) {
        el.scrollTop = 0;
      }
    },
  };
}
