import { signal, type Signal } from '@angular/core';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';

/**
 * Configuration for {@link createTypeaheadController}.
 *
 * @category interactive
 */
export interface TypeaheadControllerOptions<T> {
  /**
   * Flat list of candidate options in listbox order. Typeahead matches
   * walk this list starting from a caller-supplied `currentIndex`, wrap
   * around, and skip any option flagged `disabled`.
   */
  readonly options: Signal<readonly CngxSelectOptionDef<T>[]>;
  /**
   * Caller-supplied comparator. Reserved — the current controller matches
   * by lowercased `label.startsWith(buffer)` and does not call
   * `compareWith` internally, but exposing it keeps the options shape
   * aligned with {@link createSelectCore} and future behaviours
   * (per-option key-based caching, fuzzy match).
   */
  readonly compareWith: Signal<CngxSelectCompareFn<T>>;
  /**
   * Debounce window (ms) before the accumulated buffer resets. Maps 1:1
   * to `typeaheadDebounceInterval` on the select variants.
   */
  readonly debounceMs: Signal<number>;
  /**
   * When `true`, `matchFromIndex` returns `null` unconditionally. Wire
   * to `computed(() => this.core.disabled())` so typeahead input is
   * suppressed in disabled selects.
   */
  readonly disabled: Signal<boolean>;
}

/**
 * Public API returned from {@link createTypeaheadController}.
 *
 * @category interactive
 */
export interface TypeaheadController<T> {
  /**
   * Append a printable character to the internal buffer and return the
   * first option whose lowercased label starts with the updated buffer,
   * round-robin. Walk-start semantics:
   *
   * - `currentIndex < 0` — "nothing is highlighted". Walk inclusively
   *   from index 0, so fresh typeahead jumps to the first match.
   * - `currentIndex ≥ 0` — "this option is currently highlighted".
   *   Walk exclusively starting at the next index and wrap around so
   *   repeated taps of the same letter advance past the current row
   *   (native `<select>` parity).
   *
   * Returns `null` when the char is not printable, the controller is
   * disabled, there are no options, or nothing matches.
   *
   * The buffer auto-clears after `debounceMs` since the last push so
   * rapid typing behaves like native `<select>` (multi-char resolve)
   * while slow typing degrades to single-char jumps.
   */
  matchFromIndex(char: string, currentIndex: number): CngxSelectOptionDef<T> | null;
  /** Clear the buffer + pending debounce timer immediately. Idempotent. */
  clearBuffer(): void;
  /** Current buffer contents. Useful for dev-tools / diagnostics. */
  readonly buffer: Signal<string>;
}

/**
 * Signal-friendly implementation of the `<select>` keyboard-typeahead
 * contract. Factored out of the three select variants so that the single
 * canonical behaviour — printable-key guard, lower-case match, disabled
 * skip, round-robin walk, debounced buffer reset — is specified in one
 * place with spec-lock tests, and every variant (+ the forthcoming
 * `CngxTypeahead`) shares the same lifecycle.
 *
 * The controller is state-holding (buffer + debounce timer) but keeps no
 * DI refs of its own — callers create it in an injection context and own
 * its lifetime via the enclosing component's `DestroyRef`. Call
 * {@link TypeaheadController.clearBuffer} in a teardown hook when the
 * host component is short-lived.
 *
 * @category interactive
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

  const matchFromIndex = (
    char: string,
    currentIndex: number,
  ): CngxSelectOptionDef<T> | null => {
    if (options.disabled()) {
      return null;
    }
    if (char.length !== 1 || !/\S/.test(char)) {
      return null;
    }
    const next = buffer() + char.toLowerCase();
    buffer.set(next);
    scheduleReset();

    const opts = options.options();
    const count = opts.length;
    if (count === 0) {
      return null;
    }
    // `currentIndex < 0` means "no option is currently highlighted" —
    // walk the list inclusively from index 0. Otherwise start AFTER the
    // current option so repeated same-letter taps cycle through matches
    // (native `<select>` parity) and never re-hit the currently
    // highlighted row first. One loop covers both cases by pre-shifting.
    const effectiveStart = currentIndex < 0 ? 0 : (currentIndex + 1) % count;
    for (let i = 0; i < count; i++) {
      const idx = (effectiveStart + i) % count;
      const candidate = opts[idx];
      if (candidate.disabled) {
        continue;
      }
      if (candidate.label.toLowerCase().startsWith(next)) {
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
 * Pure helper for PageUp / PageDown navigation inside a listbox — the
 * disabled-aware, clamped `±step` jump that single- and multi-select
 * share. Returns the target index or `null` when no non-disabled
 * candidate exists within the clamped range.
 *
 * Extracted from the variants' keydown handlers so the family ships one
 * page-jump semantics (first step in direction, then back-probe if
 * disabled, else give up). Consumers pass the listbox's options and a
 * `disabled` predicate — the helper does not care about option shape
 * beyond disabled-ness.
 *
 * @category interactive
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
