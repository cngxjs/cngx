import { signal, type Signal } from '@angular/core';

import { createTypeaheadMatcher } from '@cngx/core/utils';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './internal/select-core';

/**
 * Configuration for {@link createTypeaheadController}.
 */
export interface TypeaheadControllerOptions<T> {
  /** Flat candidate list in listbox order. */
  readonly options: Signal<readonly CngxSelectOptionDef<T>[]>;
  /** Reserved - the matcher compares labels only. */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  /** Buffer-reset window. Maps to `typeaheadDebounceInterval`. */
  readonly debounceMs: Signal<number>;
  /** `true` short-circuits `matchFromIndex` to `null`. */
  readonly disabled: Signal<boolean>;
  /**
   * Locale the buffer and the labels are folded with (`injectLocale()`).
   * Without it, both lowercase with `toLowerCase()`; accents are ignored
   * either way.
   */
  readonly locale?: Signal<string>;
}

/**
 * Public API returned from {@link createTypeaheadController}.
 */
export interface TypeaheadController<T> {
  /**
   * Appends `char` to the buffer and returns the first non-disabled
   * option whose label starts with it, case- and accent-tolerant in
   * `locale` (`createTypeaheadMatcher`). A buffer of one repeated
   * character matches as that character. `currentIndex < 0` walks
   * inclusively from 0; otherwise a single-character term walks from
   * after the current option with round-robin (each press advances) and a
   * multi-character term starts at the current option, the same walk as
   * the open listbox. Returns `null` for
   * non-printable input, disabled state, empty options, or no match.
   * Buffer auto-clears after `debounceMs`.
   */
  matchFromIndex(char: string, currentIndex: number): CngxSelectOptionDef<T> | null;
  /** Idempotent - clears buffer + pending timer. */
  clearBuffer(): void;
  readonly buffer: Signal<string>;
}

/**
 * `<select>` keyboard-typeahead: printable-key guard, folded prefix match,
 * disabled skip, round-robin walk, debounced buffer reset. State-holding
 * (buffer + timer) but no DI refs; caller owns the lifetime.
 */
export function createTypeaheadController<T>(
  options: TypeaheadControllerOptions<T>,
): TypeaheadController<T> {
  const buffer = signal<string>('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleReset = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      buffer.set('');
      timer = null;
    }, options.debounceMs());
  };

  const clearBuffer = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    buffer.set('');
  };

  const matchFromIndex = (char: string, currentIndex: number): CngxSelectOptionDef<T> | null => {
    if (options.disabled()) {
      return null;
    }
    if (char.length !== 1 || !/\S/.test(char)) {
      return null;
    }
    const locale = options.locale?.();
    const next = buffer() + (locale ? char.toLocaleLowerCase(locale) : char.toLowerCase());
    buffer.set(next);
    scheduleReset();

    const opts = options.options();
    const count = opts.length;
    if (count === 0) {
      return null;
    }
    // Same walk as the open listbox (CngxActiveDescendant): a repeated
    // letter collapses to that letter, and a single-character term cycles
    // from AFTER the current option. A genuine multi-character term keeps
    // matching the current option first. No highlight walks from 0.
    const sameChar = next.length > 1 && [...next].every((c) => c === next[0]);
    const term = sameChar ? next[0] : next;
    const cycles = term.length === 1 && currentIndex >= 0;
    const effectiveStart = cycles ? currentIndex + 1 : Math.max(0, currentIndex);
    const matches = createTypeaheadMatcher(term, locale);
    for (let i = 0; i < count; i++) {
      const idx = (effectiveStart + i) % count;
      const candidate = opts[idx];
      if (candidate.disabled) {
        continue;
      }
      if (matches(candidate.label, candidate)) {
        return candidate;
      }
    }
    return null;
  };

  return {
    matchFromIndex,
    clearBuffer,
    buffer: buffer.asReadonly(),
  };
}

/**
 * PageUp/PageDown helper. Disabled-aware, clamped `±step` jump with
 * back-probe fallback. Returns target index or `null`.
 */
export function resolvePageJumpTarget<O>(
  opts: readonly O[],
  currentIndex: number,
  direction: 1 | -1,
  isDisabled: (opt: O) => boolean,
  step = 10,
): number | null {
  const total = opts.length;
  if (total === 0) {
    return null;
  }
  const from = currentIndex < 0 ? 0 : currentIndex;
  let target = Math.max(0, Math.min(total - 1, from + step * direction));
  while (isDisabled(opts[target]) && target > 0 && target < total - 1) {
    target += direction;
  }
  if (!isDisabled(opts[target])) {
    return target;
  }
  let probe = target - direction;
  while (probe >= 0 && probe < total && isDisabled(opts[probe])) {
    probe -= direction;
  }
  if (probe >= 0 && probe < total) {
    return probe;
  }
  return null;
}
