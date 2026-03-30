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
  untracked,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import { createTransitionTracker } from '@cngx/core/utils';

import { computeRange } from './range-computer';
import { createScrollObserver } from './scroll-observer';
import { createSizeCache } from './size-cache';

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
export const CNGX_RECYCLER_I18N = new InjectionToken<RecyclerI18n>('CngxRecyclerI18n', {
  factory: (): RecyclerI18n => ({
    loaded: (n, t) => `${n} more items loaded. ${t} total.`,
    filtered: (c) => `${c} results found.`,
    empty: () => 'No results.',
    error: () => 'Error loading data.',
  }),
});

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

  // ── Deep-link scroll ─────────────────────────────────
  /**
   * Target index that `scrollToIndex()` is waiting for.
   * Non-null when the target index exceeds `totalCount` — consumer
   * can show a "Scrolling to item..." indicator or trigger page loads.
   * Clears automatically when `totalCount` grows past the target.
   */
  readonly pendingTarget: Signal<number | null>;

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
  const isGrid = (config.layout ?? 'list') === 'grid';

  // Grid mode: require explicit columns
  if (isGrid && config.columns == null && isDevMode()) {
    console.error(
      '[CngxRecycler] layout: "grid" requires explicit `columns`. Falling back to columns=1.',
    );
  }

  // Reactive columns — reactive only if the function reads a Signal internally
  const columns = computed(() => {
    if (!isGrid || config.columns == null) {
      return 1;
    }
    return typeof config.columns === 'function' ? config.columns() : config.columns;
  });

  if (typeof config.estimateSize === 'function' && isDevMode()) {
    const count = config.totalCount();
    if (count > 10_000) {
      console.warn(
        `[CngxRecycler] estimateSize as a function with ${count} items has O(n) ` +
          `per-frame cost. Consider using a fixed estimateSize for large datasets.`,
      );
    }
  }

  // ── Scroll observer (lazy DOM resolution inside effect) ──
  const scrollState = createScrollObserver(config.scrollElement, destroyRef);

  // ── Size cache (Phase 2) — measured heights override estimateSize ──
  const sizeCache = createSizeCache();

  // Resolve size for an index: measured value from cache, or estimateSize fallback.
  // Reading sizeCache.version() creates a reactive dependency so that range
  // recomputes when measurements change.
  const resolveSize = (index: number): number => {
    sizeCache.version(); // track dependency
    return sizeCache.resolve(index, config.estimateSize);
  };

  // ── Range computation ──
  // Grid mode uses raw estimateSize (uniform row height, no SizeCache).
  // List mode uses resolveSize (SizeCache-backed).
  const range = computed(() => {
    const cols = columns();
    const size = isGrid ? config.estimateSize : resolveSize;
    return computeRange(
      scrollState.scrollTop(),
      scrollState.clientHeight(),
      config.totalCount(),
      size,
      overscan,
      cols,
    );
  });

  const start = computed(() => range().start);
  const end = computed(() => range().end);

  // Grid mode: pixel spacers are 0 (placeholders used instead)
  const offsetBefore = computed(() => (isGrid ? 0 : range().offsetBefore));
  const offsetAfter = computed(() => (isGrid ? 0 : range().offsetAfter));
  const totalSize = computed(() => range().totalSize);

  // ── Grid placeholders ──
  const placeholdersBefore = computed(() => (isGrid ? start() : 0));
  const placeholdersAfter = computed(() =>
    isGrid ? Math.max(0, config.totalCount() - end()) : 0,
  );

  // ── Visibility without overscan ──
  // start/end include overscan. firstVisible/lastVisible strip it back
  // to reflect the items actually in the viewport.
  // In grid mode, overscan is in rows (ceil(overscan/columns) * columns items).
  const effectiveOverscan = computed(() => {
    const cols = columns();
    if (cols <= 1) {
      return overscan;
    }
    return Math.ceil(overscan / cols) * cols;
  });

  const firstVisible = computed(() => {
    const total = config.totalCount();
    if (total === 0) {
      return 0;
    }
    return Math.min(start() + effectiveOverscan(), total - 1);
  });

  const lastVisible = computed(() => {
    const total = config.totalCount();
    if (total === 0) {
      return 0;
    }
    return Math.min(Math.max(0, end() - effectiveOverscan() - 1), total - 1);
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

  const skeletonSlots = computed(() => {
    const ch = scrollState.clientHeight();
    if (ch <= 0) {
      return 0;
    }
    // Resolve estimateSize reactively — function variant may read signals internally
    const itemHeight =
      typeof config.estimateSize === 'number' ? config.estimateSize : config.estimateSize(0);
    return Math.ceil(ch / itemHeight);
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
      // untracked: previousTotal is bookkeeping, not a dependency —
      // the effect should fire on status/totalCount changes, not on its own writes.
      const prevTotal = untracked(() => previousTotal());

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

      untracked(() => previousTotal.set(total));
    });
  } else {
    // Without async state, track totalCount changes for infinite scroll announcements
    effect(() => {
      const total = config.totalCount();
      // untracked: previousTotal is bookkeeping, not a dependency
      const prevTotal = untracked(() => previousTotal());
      const diff = total - prevTotal;

      if (prevTotal > 0 && diff > 0) {
        announcementState.set(i18n.loaded(diff, total));
      } else if (prevTotal > 0 && total === 0) {
        announcementState.set(i18n.empty());
      }

      untracked(() => previousTotal.set(total));
    });
  }

  // ── A11y ──
  const ariaSetSize = computed(() => config.serverTotal?.() ?? config.totalCount());

  // ── Scroll-Anchoring (Phase 2) ──
  const anchorState = signal<{ index: number; offsetFromTop: number } | null>(null);

  function computeItemTop(targetIndex: number, cols?: number): number {
    // Grid mode: row-based offset (uniform row height)
    if (isGrid && typeof config.estimateSize === 'number') {
      const c = cols ?? columns();
      return Math.floor(targetIndex / c) * config.estimateSize;
    }
    let top = 0;
    for (let i = 0; i < targetIndex; i++) {
      top += sizeCache.resolve(i, config.estimateSize);
    }
    return top;
  }

  // Anchor correction effect: when items shift above the anchored item,
  // correct scrollTop to keep it at the same visual position.
  effect(() => {
    const anchor = anchorState();
    if (!anchor) {
      return;
    }
    sizeCache.version(); // re-run when sizes change
    config.totalCount(); // re-run when items change
    const cols = columns(); // re-run when columns change (responsive grid)
    const el = scrollState.element();
    if (!el) {
      return;
    }
    const currentItemTop = computeItemTop(anchor.index, cols);
    const targetScrollTop = currentItemTop - anchor.offsetFromTop;
    if (Math.abs(el.scrollTop - targetScrollTop) > 1) {
      el.scrollTop = targetScrollTop;
    }
  });

  // ── Focus-Preservation (Phase 2) ──
  // Tracks which item has focus inside the scroll container.
  // Uses `data-cngx-recycle-index` attribute on items (set by CngxMeasure or consumer).
  // When a focused item leaves the visible range, `lostFocus` reports its index.
  const focusedIndex = signal<number | null>(null);

  effect((onCleanup) => {
    const el = scrollState.element();
    if (!el) {
      return;
    }
    const handleFocusIn = (e: FocusEvent): void => {
      const target = (e.target as HTMLElement).closest('[data-cngx-recycle-index]');
      if (target) {
        focusedIndex.set(Number(target.getAttribute('data-cngx-recycle-index')));
      }
    };
    const handleFocusOut = (): void => {
      focusedIndex.set(null);
    };
    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleFocusOut);
    onCleanup(() => {
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleFocusOut);
    });
  });

  const lostFocus = computed(() => {
    const fi = focusedIndex();
    if (fi == null) {
      return null;
    }
    const s = start();
    const e = end();
    if (fi < s || fi >= e) {
      return { index: fi };
    }
    return null;
  });

  // ── Deep-link scrollToIndex (Phase 3) ──
  const pendingScrollTarget = signal<{ index: number; behavior: ScrollBehavior } | null>(null);
  const pendingTarget = computed(() => pendingScrollTarget()?.index ?? null);

  // Watch totalCount — when it grows past the pending target, execute the scroll.
  // Uses untracked() for pendingScrollTarget reads/writes to avoid write-inside-read loops.
  // Only totalCount is a tracked dependency.
  effect(() => {
    const total = config.totalCount(); // tracked dependency
    const target = untracked(() => pendingScrollTarget()); // NOT tracked
    if (!target || target.index >= total) {
      return;
    }
    // Target now reachable — execute scroll
    untracked(() => {
      pendingScrollTarget.set(null);
      const el = scrollState.element();
      if (el) {
        const top = computeItemTop(target.index);
        el.scrollTo({ top, behavior: target.behavior });
      }
    });
  });

  return {
    start,
    end,
    offsetBefore,
    offsetAfter,
    totalSize,

    placeholdersBefore,
    placeholdersAfter,

    isLoading,
    isRefreshing,
    isEmpty,
    skeletonSlots,
    showSkeleton,

    firstVisible,
    lastVisible,
    visibleCount,

    anchorTo(index: number): void {
      const el = scrollState.element();
      if (!el) {
        return;
      }
      const itemTop = computeItemTop(index);
      anchorState.set({ index, offsetFromTop: itemTop - el.scrollTop });
    },

    releaseAnchor(): void {
      anchorState.set(null);
    },

    lostFocus,

    pendingTarget,

    announcement: announcementState.asReadonly(),

    ariaSetSize,

    sliced<T>(items: Signal<T[]>): Signal<T[]> {
      return computed(() => items().slice(start(), end()));
    },

    measure(index: number, element: HTMLElement): void {
      // Grid mode assumes uniform row height — SizeCache writes would break row-based range.
      if (isGrid) {
        return;
      }
      const height = element.getBoundingClientRect().height;
      if (height > 0) {
        sizeCache.set(index, height);
      }
    },

    scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
      const total = config.totalCount();
      if (index >= total) {
        // Deep-link: target not loaded yet — store for later resolution
        pendingScrollTarget.set({ index, behavior });
        return;
      }
      // Clear any pending target
      pendingScrollTarget.set(null);
      const el = scrollState.element();
      if (el) {
        el.scrollTo({ top: computeItemTop(index), behavior });
      }
    },

    reset(): void {
      const el = scrollState.element();
      if (el) {
        el.scrollTop = 0;
      }
    },
  };
}
