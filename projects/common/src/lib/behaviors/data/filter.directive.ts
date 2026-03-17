import { computed, Directive, input, output, signal } from '@angular/core';

/**
 * Atom directive that holds a filter predicate function.
 *
 * Supports both **uncontrolled** (internal state) and **controlled** modes.
 * In controlled mode the `cngxFilter` input takes precedence over internal
 * state — pair with `filterChange` to keep it in sync.
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
  /** Controlled predicate. When bound, takes precedence over internal state. */
  readonly predicateInput = input<((value: T) => boolean) | null>(null, { alias: 'cngxFilter' });

  private readonly _predicate = signal<((value: T) => boolean) | null>(null);

  /** The active filter predicate, or `null` when filtering is inactive. */
  readonly predicate = computed(() => this.predicateInput() ?? this._predicate());
  /** `true` when a predicate is active. */
  readonly isActive = computed(() => this.predicate() !== null);

  /** Emitted whenever the predicate changes. */
  readonly filterChange = output<((value: T) => boolean) | null>();

  /** Sets a new predicate and emits `filterChange`. */
  setPredicate(fn: ((value: T) => boolean) | null): void {
    this._predicate.set(fn);
    this.filterChange.emit(fn);
  }

  /** Clears the active predicate. */
  clear(): void {
    this.setPredicate(null);
  }
}
