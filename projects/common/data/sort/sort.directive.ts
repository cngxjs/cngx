import { afterNextRender, computed, Directive, input, output, signal } from '@angular/core';

/**
 * A single sort entry: the active field key and its direction.
 *
 * @category common/data/sort
 */
export interface SortEntry {
  active: string;
  direction: 'asc' | 'desc';
}

function entryEqual(a: SortEntry | null | undefined, b: SortEntry | null | undefined): boolean {
  return a === b || (!!a && !!b && a.active === b.active && a.direction === b.direction);
}

function entriesEqual(a: SortEntry[], b: SortEntry[]): boolean {
  return a === b || (a.length === b.length && a.every((entry, i) => entryEqual(entry, b[i])));
}

/**
 * Atom directive that tracks sort state (active field + direction).
 *
 * Supports both **uncontrolled** (internal state) and **controlled** modes.
 * In controlled mode the `cngxSortActive` / `cngxSortDirection` inputs take
 * precedence over the internal state - pair with `sortChange` to keep them
 * in sync.
 *
 * An uncontrolled sort may declare a **starting** column + direction via
 * `[cngxSortInitial]`: it seeds the internal state exactly once on init, then
 * user clicks take over. Distinct from the controlled `cngxSortActive` /
 * `cngxSortDirection` pins - the seed is skipped when a controlled pin is bound.
 *
 * When `multiSort` is `true`, holding **Shift** while clicking a sort header
 * adds it as a secondary (tertiary, …) sort key instead of replacing the
 * primary one. Shift-clicking an active column cycles it asc → desc → removed.
 * Multi-sort state is always uncontrolled; use `sortsChange` to read it.
 * While a controlled pin is bound, additive clicks degrade to the
 * single-sort cycle.
 *
 * Consumer connects this to a table or list via a `computed()` - nothing is
 * injected automatically.
 *
 * @category common/data/sort
 * @docsKind primary
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/sort/sort.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSortHeader, CngxFilter, CngxPaginate, CngxSmartDataSource
 *
 * <example-url>http://localhost:4200/#/common/data/sort/basic</example-url>
 * <example-url>http://localhost:4200/#/common/data/sort/multi-sort</example-url>
 * <example-url>http://localhost:4200/#/common/data/sort/controlled</example-url>
 * <example-url>http://localhost:4200/#/common/data/sort/aria-and-keyboard</example-url>
 */
@Directive({
  selector: '[cngxSort]',
  exportAs: 'cngxSort',
  standalone: true,
})
export class CngxSort {
  /** Controlled active column. When bound, takes precedence over internal state (single-sort only). */
  readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
  /** Controlled direction. When bound, takes precedence over internal state (single-sort only). */
  readonly directionInput = input<'asc' | 'desc' | undefined>(undefined, {
    alias: 'cngxSortDirection',
  });
  /**
   * When `true`, Shift+click on a sort header adds it to the sort stack instead of
   * replacing the current sort.
   */
  readonly multiSort = input<boolean>(false);
  /**
   * Uncontrolled starting sort. Seeds the internal state once on init if no sort
   * is set yet and no controlled `cngxSortActive` pin is bound; user clicks own
   * it thereafter. Ignored in controlled mode.
   */
  readonly initialSort = input<SortEntry | undefined>(undefined, { alias: 'cngxSortInitial' });

  private readonly sortsState = signal<SortEntry[]>([]);

  constructor() {
    // One-shot uncontrolled seed: not a reactive derivation, so afterNextRender
    // (single-shot, outside the signal graph) rather than an effect. The empty +
    // no-controlled-pin guards keep it from clobbering an early click or writing
    // an invisible state that would surface when a controlled pin unbinds.
    afterNextRender(() => {
      const seed = this.initialSort();
      if (seed && this.sortsState().length === 0 && this.activeInput() === undefined) {
        this.sortsState.set([seed]);
      }
    });
  }

  /** The active sort column of the primary entry (controlled takes precedence in single-sort mode). */
  readonly active = computed(() => this.activeInput() ?? this.sorts()[0]?.active);
  /** The active sort direction of the primary entry (controlled takes precedence in single-sort mode). */
  readonly direction = computed(() => this.directionInput() ?? this.sorts()[0]?.direction);

  /**
   * The primary sort state, or `null` when no sort is active.
   * In multi-sort mode this is the first entry in `sorts`.
   */
  readonly sort = computed(
    () => (this.active() ? { active: this.active(), direction: this.direction() ?? 'asc' } : null),
    { equal: entryEqual },
  );

  /**
   * All active sort entries in priority order.
   * Contains at most one entry when additive mode has not been used.
   * In controlled mode the entry is derived from `cngxSortActive` /
   * `cngxSortDirection` (a falsy active key means no sort); headers and
   * data sources read this signal, so the controlled pin drives them too.
   */
  readonly sorts = computed<SortEntry[]>(
    () => {
      const controlledActive = this.activeInput();
      if (controlledActive !== undefined) {
        if (!controlledActive) {
          return [];
        }
        return [{ active: controlledActive, direction: this.directionInput() ?? 'asc' }];
      }
      return this.sortsState();
    },
    // Structural equal: the controlled branch builds a fresh entry literal on
    // every recompute; identity churn here would cascade into header state and
    // a full re-sort in CngxSmartDataSource.processed.
    { equal: entriesEqual },
  );

  /** `true` when at least one sort is active. */
  readonly isActive = computed(() => this.sorts().length > 0);

  /** Emitted when the primary sort state changes. Emits `undefined` on clear. */
  readonly sortChange = output<SortEntry | undefined>();
  /**
   * Emitted whenever the sort stack changes (including removals and full clears).
   * Always reflects the full `sorts` array at the time of emission.
   */
  readonly sortsChange = output<SortEntry[]>();

  /**
   * Sets or toggles the sort for `field`.
   *
   * **`additive = false`** (default, plain click):
   * - Same field → cycle `asc` → `desc` → cleared (a third click removes the sort)
   * - Different field → replace stack with `{ field, asc }`
   *
   * **`additive = true`** (Shift+click when `multiSort` is enabled on the header):
   * - Field not in stack → append as asc
   * - Field in stack as asc → change to desc
   * - Field in stack as desc → remove from stack
   *
   * With a controlled `cngxSortActive` pin bound, the sort is event-only: the
   * cycle is computed off the effective entry and emitted, the internal state
   * stays untouched (nothing stale surfaces if the pin unbinds later). Since
   * multi-sort is always uncontrolled, an additive call degrades to the
   * non-additive controlled cycle while a pin is bound.
   */
  setSort(field: string, additive = false): void {
    if (additive && this.activeInput() === undefined) {
      const current = this.sortsState();
      const idx = current.findIndex((s) => s.active === field);
      let next: SortEntry[];
      if (idx === -1) {
        next = [...current, { active: field, direction: 'asc' }];
      } else if (current[idx].direction === 'asc') {
        next = current.map((s, i) => (i === idx ? { ...s, direction: 'desc' as const } : s));
      } else {
        next = current.filter((_, i) => i !== idx);
      }
      this.sortsState.set(next);
      this.sortsChange.emit(next);
      this.sortChange.emit(next[0]);
    } else {
      // Cycle off the effective state: with a controlled pin bound, the first
      // click on the pinned column must continue the cycle (asc -> desc), not
      // restart it from the empty internal state. In that case the write is
      // skipped too - the consumer owns the state, and a shadow copy would
      // surface as stale sort once the pin unbinds.
      const controlled = this.activeInput() !== undefined;
      const current = this.sorts();
      if (field === current[0]?.active && current[0].direction === 'desc') {
        // Third click on the active column: cycle desc -> cleared.
        if (!controlled) {
          this.sortsState.set([]);
        }
        this.sortChange.emit(undefined);
        this.sortsChange.emit([]);
      } else {
        const dir: 'asc' | 'desc' = field === current[0]?.active ? 'desc' : 'asc';
        const entry: SortEntry = { active: field, direction: dir };
        if (!controlled) {
          this.sortsState.set([entry]);
        }
        this.sortChange.emit(entry);
        this.sortsChange.emit([entry]);
      }
    }
  }

  /** Clears all active sorts. Emits both `sortChange(undefined)` and `sortsChange([])`. */
  clear(): void {
    this.sortsState.set([]);
    this.sortChange.emit(undefined);
    this.sortsChange.emit([]);
  }
}
