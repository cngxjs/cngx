import { computed, signal, type Signal, type WritableSignal } from '@angular/core';

/**
 * Configuration options for `createSelectionController`.
 *
 * @category selection
 */
export interface SelectionControllerOptions<T> {
  /**
   * Key extractor for membership Map. Defaults to the value itself
   * (reference / primitive equality). Supply when T is a structural object
   * that should be matched by a stable id.
   */
  readonly keyFn?: (value: T) => unknown;
  /**
   * Optional children lookup. When supplied, `isIndeterminate(value)`
   * returns true iff SOME but not ALL descendants are selected. Flat
   * lists omit this; `isIndeterminate` then always returns a shared
   * `Signal<false>` constant (no per-value allocation).
   */
  readonly childrenFn?: (value: T) => readonly T[];
}

/**
 * Signal-based selection engine. Reads + writes an external
 * `WritableSignal<T[]>` — does not own the values.
 *
 * Memoizes per-value `isSelected` / `isIndeterminate` signals by key so
 * template diff stays stable and consumers can pass the handle into child
 * components without identity churn.
 *
 * @category selection
 */
export interface SelectionController<T> {
  /** Snapshot of currently selected values (structural-equality computed). */
  readonly selected: Signal<readonly T[]>;
  /** Current selection size. */
  readonly selectedCount: Signal<number>;
  /** `true` when nothing is selected. */
  readonly isEmpty: Signal<boolean>;
  /** `true` when at least one value is selected. */
  readonly hasSelection: Signal<boolean>;
  /**
   * Reactive membership for a single value. Same value (by `keyFn`) always
   * returns the SAME `Signal` instance — safe to pass into OnPush children
   * or compare with `===`.
   */
  isSelected(value: T): Signal<boolean>;
  /**
   * Reactive indeterminate state. With `childrenFn`: true iff SOME but not
   * ALL descendants are selected. Without: always returns a shared constant
   * `Signal<false>`.
   */
  isIndeterminate(value: T): Signal<boolean>;
  /** Idempotent add. No-op if already selected. */
  select(value: T): void;
  /** Remove from selection. No-op if not selected. */
  deselect(value: T): void;
  /** Toggle a single value. */
  toggle(value: T): void;
  /**
   * Toggle-all semantics over a group: if every value in `values` is already
   * selected, remove them all; otherwise add the missing ones.
   */
  toggleAll(values: readonly T[]): void;
  /** Clear selection. */
  clear(): void;
  /** Replace selection with the given values (copied). */
  set(values: readonly T[]): void;
}

/**
 * Create a signal-based selection engine that reads and writes an external
 * `WritableSignal<T[]>`.
 *
 * @usageNotes
 *
 * ```ts
 * const values = signal<User[]>([]);
 * const selection = createSelectionController(values, { keyFn: (u) => u.id });
 *
 * selection.select(alice);
 * selection.isSelected(alice)();      // true
 * selection.isSelected(alice) === selection.isSelected(alice); // stable
 * ```
 *
 * @category selection
 */
export function createSelectionController<T>(
  values: WritableSignal<T[]>,
  options?: SelectionControllerOptions<T>,
): SelectionController<T> {
  const keyFn = options?.keyFn ?? ((v: T) => v as unknown);
  const childrenFn = options?.childrenFn;

  // Membership Map — rebuilds only when values() identity changes.
  const membership = computed<Map<unknown, true>>(() => {
    const m = new Map<unknown, true>();
    for (const v of values()) {
      m.set(keyFn(v), true);
    }
    return m;
  });

  const selected = computed<readonly T[]>(() => values().slice(), {
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
  });
  const selectedCount = computed(() => values().length);
  const isEmpty = computed(() => selectedCount() === 0);
  const hasSelection = computed(() => selectedCount() > 0);

  // Per-value isSelected cache — stable signal identity per key.
  const selectedCache = new Map<unknown, Signal<boolean>>();
  const isSelected = (value: T): Signal<boolean> => {
    const key = keyFn(value);
    let sig = selectedCache.get(key);
    if (!sig) {
      sig = computed(() => membership().has(key));
      selectedCache.set(key, sig);
    }
    return sig;
  };

  // Shared always-false signal for flat-list indeterminate.
  const FALSE = signal(false).asReadonly();
  const indeterminateCache = new Map<unknown, Signal<boolean>>();
  const isIndeterminate = (value: T): Signal<boolean> => {
    if (!childrenFn) {
      return FALSE;
    }
    const key = keyFn(value);
    let sig = indeterminateCache.get(key);
    if (!sig) {
      sig = computed(() => {
        const map = membership();
        const visited = new Set<unknown>();
        const descendants: T[] = [];
        const walk = (v: T): void => {
          const k = keyFn(v);
          if (visited.has(k)) {
            return;
          }
          visited.add(k);
          for (const c of childrenFn(v)) {
            descendants.push(c);
            walk(c);
          }
        };
        walk(value);
        if (descendants.length === 0) {
          return false;
        }
        let sel = 0;
        for (const d of descendants) {
          if (map.has(keyFn(d))) {
            sel++;
          }
        }
        return sel > 0 && sel < descendants.length;
      });
      indeterminateCache.set(key, sig);
    }
    return sig;
  };

  const select = (v: T): void => {
    const key = keyFn(v);
    if (membership().has(key)) {
      return;
    }
    values.update((arr) => [...arr, v]);
  };
  const deselect = (v: T): void => {
    const key = keyFn(v);
    if (!membership().has(key)) {
      return;
    }
    values.update((arr) => arr.filter((x) => keyFn(x) !== key));
  };
  const toggle = (v: T): void => {
    if (membership().has(keyFn(v))) {
      deselect(v);
    } else {
      select(v);
    }
  };
  const toggleAll = (vs: readonly T[]): void => {
    if (vs.length === 0) {
      return;
    }
    const m = membership();
    const allSelected = vs.every((v) => m.has(keyFn(v)));
    if (allSelected) {
      const keys = new Set(vs.map(keyFn));
      values.update((arr) => arr.filter((x) => !keys.has(keyFn(x))));
    } else {
      const present = new Set(m.keys());
      const add = vs.filter((v) => !present.has(keyFn(v)));
      if (add.length === 0) {
        return;
      }
      values.update((arr) => [...arr, ...add]);
    }
  };
  const clear = (): void => {
    if (!hasSelection()) {
      return;
    }
    values.set([]);
  };
  const setFn = (vs: readonly T[]): void => {
    values.set([...vs]);
  };

  return {
    selected,
    selectedCount,
    isEmpty,
    hasSelection,
    isSelected,
    isIndeterminate,
    select,
    deselect,
    toggle,
    toggleAll,
    clear,
    set: setFn,
  };
}
