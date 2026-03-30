import { computed, Directive, input, output, signal } from '@angular/core';

/**
 * Atom directive that holds one or more named filter predicates.
 *
 * Supports both **uncontrolled** (internal state) and **controlled** modes.
 * In controlled mode the `cngxFilter` input takes precedence over the internal
 * `'default'` predicate — pair with `filterChange` to keep it in sync.
 *
 * **Multi-filter** — use `addPredicate(key, fn)` / `removePredicate(key)` to
 * maintain a named stack of predicates. All active predicates are **AND-combined**
 * across keys: an item must pass every registered predicate to appear in results.
 *
 * AND vs OR — the directive enforces AND across dimensions (keys). OR logic
 * within a single dimension stays inside the predicate function itself:
 *
 * ```typescript
 * // AND across dimensions: location AND role must both match
 * filter.addPredicate('location', p => selectedLocations.has(p.location));
 * filter.addPredicate('role',     p => selectedRoles.has(p.role));
 *
 * // OR within a dimension: London OR Rome — just put a Set inside one predicate
 * filter.addPredicate('location', p => selectedLocations.has(p.location));
 * ```
 *
 * `setPredicate` / `clear` operate on the `'default'` key and remain fully
 * backward-compatible with single-predicate usage.
 *
 * Consumer connects this to a list via a `computed()` — nothing is injected
 * automatically.
 *
 * @typeParam T - The item type the predicate operates on.
 */
@Directive({
  selector: '[cngxFilter]',
  exportAs: 'cngxFilter',
  standalone: true,
})
export class CngxFilter<T = unknown> {
  /** Controlled predicate. When bound, takes precedence over the `'default'` internal predicate. */
  readonly predicateInput = input<((value: T) => boolean) | null>(null, { alias: 'cngxFilter' });

  private readonly predicatesState = signal<Map<string, (value: T) => boolean>>(new Map());

  /**
   * All active named predicates.
   * Use `addPredicate` / `removePredicate` to manage this map.
   */
  readonly predicates = this.predicatesState.asReadonly();

  /** Number of active named predicates (controlled input not counted). */
  readonly activeCount = computed(() => this.predicatesState().size);

  /**
   * The combined predicate — AND of all active named predicates plus the
   * controlled input (when bound). Returns `null` when nothing is active.
   */
  readonly predicate = computed((): ((value: T) => boolean) | null => {
    const controlled = this.predicateInput();
    const map = this.predicatesState();

    const fns = [...(controlled ? [controlled] : []), ...map.values()];

    if (fns.length === 0) {
      return null;
    }
    if (fns.length === 1) {
      return fns[0];
    }
    return (value: T) => fns.every((fn) => fn(value));
  });

  /** `true` when at least one predicate is active. */
  readonly isActive = computed(() => this.predicate() !== null);

  /** Emitted whenever the `'default'` predicate changes (backward-compat single-filter output). */
  readonly filterChange = output<((value: T) => boolean) | null>();

  /** Emitted whenever any named predicate is added or removed. */
  readonly predicatesChange = output<Map<string, (value: T) => boolean>>();

  /**
   * Adds or replaces the named predicate `key`.
   * Emits `predicatesChange` with the updated map.
   */
  addPredicate(key: string, fn: (value: T) => boolean): void {
    const next = new Map(this.predicatesState());
    next.set(key, fn);
    this.predicatesState.set(next);
    this.predicatesChange.emit(next);
  }

  /**
   * Removes the named predicate `key` (no-op if not present).
   * Emits `predicatesChange` with the updated map.
   */
  removePredicate(key: string): void {
    const current = this.predicatesState();
    if (!current.has(key)) {
      return;
    }
    const next = new Map(current);
    next.delete(key);
    this.predicatesState.set(next);
    this.predicatesChange.emit(next);
  }

  /**
   * Sets the `'default'` predicate and emits `filterChange`.
   * Pass `null` to clear it (same as `clear()`).
   */
  setPredicate(fn: ((value: T) => boolean) | null): void {
    if (fn === null) {
      this.removePredicate('default');
    } else {
      this.addPredicate('default', fn);
    }
    this.filterChange.emit(fn);
  }

  /** Removes all named predicates and emits `filterChange` with `null`. */
  clear(): void {
    this.predicatesState.set(new Map());
    this.predicatesChange.emit(new Map());
    this.filterChange.emit(null);
  }
}
