import { effect, signal, untracked, type ElementRef, type Signal } from '@angular/core';

import type { CngxListboxSearch } from '@cngx/common/interactive';

/**
 * Configuration for {@link createDisplayBinding}.
 *
 * @category interactive
 */
export interface DisplayBindingOptions<T> {
  /**
   * Source of truth for the currently committed value. The binding
   * mirrors this into the input's visible text as
   * `displayWith(value)` while the element is not focused.
   */
  readonly value: Signal<T | undefined>;
  /** Formatter converting value to display text. */
  readonly displayWith: Signal<(v: T) => string>;
  /**
   * `true` while the underlying `<input>` is focused. The
   * value-to-input effect only writes on false so user typing is never
   * clobbered mid-edit — restoration happens explicitly via
   * {@link DisplayBinding.writeFromValue} on blur / commit / clear.
   */
  readonly focused: Signal<boolean>;
  /** Reference to the `<input>` element. Null until the view initialises. */
  readonly inputEl: Signal<ElementRef<HTMLInputElement> | undefined>;
  /** `CngxListboxSearch` mounted on the same input. */
  readonly searchRef: Signal<CngxListboxSearch | undefined>;
  /** Debounced search-term signal (typically `searchRef.term`). */
  readonly searchTerm: Signal<string>;
  /** Suppress the first `onUserSearchTerm` emission (hydrate-time ''). */
  readonly skipInitial: Signal<boolean>;
  /**
   * Invoked when the search term changes from a *user* write. Library-
   * authored writes (display-binding seeding, commit reconciliation,
   * blur restoration) are suppressed so consumers see only real typing.
   */
  readonly onUserSearchTerm: (term: string) => void;
}

/**
 * API returned from {@link createDisplayBinding}.
 *
 * @category interactive
 */
export interface DisplayBinding<T> {
  /**
   * Write `displayWith(v)` into the input and reset the underlying
   * search term to `''`. Call from initial seed, commit
   * success/rollback, and blur restoration. Idempotent — skips when
   * the input already matches the target text and no search term is
   * pending.
   */
  writeFromValue(v: T | undefined): void;
  /**
   * `true` while an internal (library-authored) write is propagating
   * through `searchRef.clear()`/native value mutation. Consumers that
   * react to `searchTerm()` for their own side effects (e.g. auto-open
   * panel on typing) should gate on this flag to avoid reacting to
   * library writes.
   */
  readonly isWritingFromValue: Signal<boolean>;
}

/**
 * Bidirectional display binding between a scalar value signal and the
 * visible text of a co-located `<input>` running `CngxListboxSearch`.
 *
 * Installs two cleanup-bound `effect()`s:
 *
 * 1. **Value → input** — whenever `value` changes and the input is not
 *    focused, write `displayWith(value)` into the element.
 * 2. **Search term → user callback** — forward user typing to
 *    `onUserSearchTerm`, suppressing library-authored writes via an
 *    internal flag and respecting `skipInitial` on the first emission.
 *
 * Extracted from `CngxTypeahead` so the display-binding contract is
 * specified in one place, with its own spec-lock tests, and any future
 * scalar autocomplete component can reuse the same plumbing instead of
 * re-implementing the input-text ↔ value reconciliation cycle.
 *
 * @category interactive
 */
export function createDisplayBinding<T>(
  opts: DisplayBindingOptions<T>,
): DisplayBinding<T> {
  const writingFlag = signal(false);
  const hasEmittedInitial = signal(false);

  const writeFromValue = (v: T | undefined): void => {
    const search = opts.searchRef();
    const el = opts.inputEl()?.nativeElement;
    if (!search || !el) {
      return;
    }
    const next = v === undefined ? '' : opts.displayWith()(v);
    if (el.value === next && !search.hasValue()) {
      return;
    }
    writingFlag.set(true);
    search.clear();
    if (next !== '') {
      el.value = next;
    }
  };

  // Value → input (skipped while focused so user typing is not clobbered).
  effect(() => {
    const v = opts.value();
    untracked(() => {
      if (!opts.focused()) {
        writeFromValue(v);
      }
    });
  });

  // Search term → user callback (library writes suppressed, skipInitial honoured).
  effect(() => {
    const term = opts.searchTerm();
    untracked(() => {
      const initial = !hasEmittedInitial();
      hasEmittedInitial.set(true);
      if (writingFlag()) {
        writingFlag.set(false);
        return;
      }
      if (initial && opts.skipInitial()) {
        return;
      }
      opts.onUserSearchTerm(term);
    });
  });

  return {
    writeFromValue,
    isWritingFromValue: writingFlag.asReadonly(),
  };
}
