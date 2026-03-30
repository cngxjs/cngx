import { computed, Directive, input, output, signal } from '@angular/core';

/**
 * A single sort entry: the active field key and its direction.
 *
 * @category sort
 */
export interface SortEntry {
  active: string;
  direction: 'asc' | 'desc';
}

/**
 * Atom directive that tracks sort state (active field + direction).
 *
 * Supports both **uncontrolled** (internal state) and **controlled** modes.
 * In controlled mode the `cngxSortActive` / `cngxSortDirection` inputs take
 * precedence over the internal state — pair with `sortChange` to keep them
 * in sync.
 *
 * When `multiSort` is `true`, holding **Shift** while clicking a sort header
 * adds it as a secondary (tertiary, …) sort key instead of replacing the
 * primary one. Shift-clicking an active column cycles it asc → desc → removed.
 * Multi-sort state is always uncontrolled; use `sortsChange` to read it.
 *
 * Consumer connects this to a table or list via a `computed()` — nothing is
 * injected automatically.
 *
 * @category sort
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

  private readonly sortsState = signal<SortEntry[]>([]);

  /** The active sort column of the primary entry (controlled takes precedence in single-sort mode). */
  readonly active = computed(() => this.activeInput() ?? this.sortsState()[0]?.active);
  /** The active sort direction of the primary entry (controlled takes precedence in single-sort mode). */
  readonly direction = computed(() => this.directionInput() ?? this.sortsState()[0]?.direction);

  /**
   * The primary sort state, or `null` when no sort is active.
   * In multi-sort mode this is the first entry in `sorts`.
   */
  readonly sort = computed(() =>
    this.active() ? { active: this.active(), direction: this.direction() ?? 'asc' } : null,
  );

  /**
   * All active sort entries in priority order.
   * Contains at most one entry when additive mode has not been used.
   */
  readonly sorts = this.sortsState.asReadonly();

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
   * - Same field → toggle direction (asc → desc → asc)
   * - Different field → replace stack with `{ field, asc }`
   *
   * **`additive = true`** (Shift+click when `multiSort` is enabled on the header):
   * - Field not in stack → append as asc
   * - Field in stack as asc → change to desc
   * - Field in stack as desc → remove from stack
   */
  setSort(field: string, additive = false): void {
    if (additive) {
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
      const current = this.sortsState();
      const dir: 'asc' | 'desc' =
        field === current[0]?.active ? (current[0].direction === 'asc' ? 'desc' : 'asc') : 'asc';
      const entry: SortEntry = { active: field, direction: dir };
      this.sortsState.set([entry]);
      this.sortChange.emit(entry);
      this.sortsChange.emit([entry]);
    }
  }

  /** Clears all active sorts. Emits both `sortChange(undefined)` and `sortsChange([])`. */
  clear(): void {
    this.sortsState.set([]);
    this.sortChange.emit(undefined);
    this.sortsChange.emit([]);
  }
}
