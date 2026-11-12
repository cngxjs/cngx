import type { DestroyRef, Signal } from '@angular/core';

import { createTypeaheadWalker } from '@cngx/core/utils';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './internal/select-core';

/**
 * Inputs a button-trigger composite hands to its closed-trigger typeahead.
 *
 * `CngxSelect`, `CngxMultiSelect`, `CngxReorderableMultiSelect` and
 * `CngxSelectShell` build one controller each and pass their flat options,
 * `compareWith`, the `[typeaheadDebounceInterval]` input and their
 * `DestroyRef`. Without `destroyRef` the caller owns the buffer-reset timer and
 * calls `clearBuffer()` itself.
 */
export interface TypeaheadControllerOptions<T> {
  /** Flat candidate list in listbox order. */
  readonly options: Signal<readonly CngxSelectOptionDef<T>[]>;
  /**
   * Resolves a value to its option index for {@link TypeaheadController.matchFromValue},
   * so a value selected under a custom equality (e.g. case-insensitive) seeds
   * the typeahead round-robin start. The prefix match itself still compares
   * labels only.
   */
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
  /**
   * Lifetime of the controller. When given, the pending buffer reset is
   * cancelled on destroy, so no timer outlives the host. Without it the caller
   * owns the lifetime and calls `clearBuffer()` itself.
   */
  readonly destroyRef?: DestroyRef;
}

/**
 * Prefix matcher the button-trigger composites call while the panel is
 * closed, the native `<select>` behaviour of typing to pick.
 *
 * The composite seeds the start index with `matchFromValue` and hands the
 * controller to the flat-nav strategy's `onTypeaheadWhileClosed`, which calls
 * `matchFromIndex`. It has no injection token; a different keyboard
 * policy goes through {@link CNGX_FLAT_NAV_STRATEGY}.
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
  /**
   * Resolves `value` to its option index through `compareWith`, so the current
   * selection seeds the typeahead round-robin start without each host
   * re-implementing the lookup. Returns `-1` for `undefined` or no match.
   */
  matchFromValue(value: T | undefined): number;
  /** Idempotent - clears buffer + pending timer. */
  clearBuffer(): void;
  readonly buffer: Signal<string>;
}

/**
 * `<select>` keyboard-typeahead: printable-key guard, folded prefix match,
 * disabled skip, round-robin walk, debounced buffer reset. The buffer and the
 * walk are `createTypeaheadWalker` from `@cngx/core/utils`, the same walk the
 * open listbox runs, so a key sequence lands on the same option with the
 * panel open or closed. State-holding (buffer + timer) but no DI refs; pass
 * `destroyRef` to cancel the pending reset on destroy.
 */
export function createTypeaheadController<T>(
  options: TypeaheadControllerOptions<T>,
): TypeaheadController<T> {
  const walker = createTypeaheadWalker({
    debounceMs: options.debounceMs,
    locale: options.locale,
  });
  options.destroyRef?.onDestroy(() => walker.clear());

  const matchFromIndex = (char: string, currentIndex: number): CngxSelectOptionDef<T> | null => {
    if (options.disabled()) {
      return null;
    }
    if (char.length !== 1) {
      return null;
    }
    // A leading space is not a typeahead key; a space inside a running buffer
    // is part of a multi-word term ("new y" -> "New York").
    if (!/\S/.test(char) && walker.buffer() === '') {
      return null;
    }
    const term = walker.type(char);
    const opts = options.options();
    const index = walker.find(opts, term, currentIndex);
    return index < 0 ? null : opts[index];
  };

  const matchFromValue = (value: T | undefined): number => {
    if (value === undefined) {
      return -1;
    }
    const eq = options.compareWith();
    return options.options().findIndex((o) => eq(o.value, value));
  };

  return {
    matchFromIndex,
    matchFromValue,
    clearBuffer: () => walker.clear(),
    buffer: walker.buffer,
  };
}

/**
 * Whether a key feeds the select typeahead: a printable character, or a space
 * while a buffer is running, so "new y" reaches "New York". A leading space
 * stays an open key.
 *
 * @internal
 */
export function typeaheadAcceptsKey(key: string, buffer: string): boolean {
  if (key.length !== 1) {
    return false;
  }
  return /\S/.test(key) || buffer !== '';
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
