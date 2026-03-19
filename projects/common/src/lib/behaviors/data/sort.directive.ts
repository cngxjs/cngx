import { computed, Directive, input, output, signal } from '@angular/core';

/**
 * Atom directive that tracks sort state (active field + direction).
 *
 * Supports both **uncontrolled** (internal state) and **controlled** modes.
 * In controlled mode the `cngxSortActive` / `cngxSortDirection` inputs take
 * precedence over the internal state — pair with `sortChange` to keep them
 * in sync.
 *
 * Consumer connects this to a table or list via a `computed()` that calls
 * `sortTree()` or similar — nothing is injected automatically.
 */
@Directive({
  selector: '[cngxSort]',
  exportAs: 'cngxSort',
  standalone: true,
})
export class CngxSort {
  /** Controlled active column. When bound, takes precedence over internal state. */
  readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
  /** Controlled direction. When bound, takes precedence over internal state. */
  readonly directionInput = input<'asc' | 'desc' | undefined>(undefined, {
    alias: 'cngxSortDirection',
  });

  private readonly _active = signal<string | undefined>(undefined);
  private readonly _direction = signal<'asc' | 'desc' | undefined>(undefined);

  /** The active sort column (controlled takes precedence). */
  readonly active = computed(() => this.activeInput() ?? this._active());
  /** The active sort direction (controlled takes precedence). */
  readonly direction = computed(() => this.directionInput() ?? this._direction());
  /** The current sort state, or `null` when no sort is active. */
  readonly sort = computed(() =>
    this.active() ? { active: this.active()!, direction: this.direction() ?? 'asc' } : null,
  );
  /** `true` when a sort is active. */
  readonly isActive = computed(() => this.sort() !== null);

  /** Emitted when the sort state changes. */
  readonly sortChange = output<{ active: string; direction: 'asc' | 'desc' }>();

  /**
   * Toggles or sets the sort for `field`.
   * - First click on a field → `asc`
   * - Second click on the same field → `desc`
   * - Clicking a different field → `asc`
   */
  setSort(field: string): void {
    const next: 'asc' | 'desc' =
      field === this._active() ? (this._direction() === 'asc' ? 'desc' : 'asc') : 'asc';
    this._active.set(field);
    this._direction.set(next);
    this.sortChange.emit({ active: field, direction: next });
  }

  /** Clears the active sort state. */
  clear(): void {
    this._active.set(undefined);
    this._direction.set(undefined);
  }
}
