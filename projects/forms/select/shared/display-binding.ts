import {
  effect,
  InjectionToken,
  signal,
  untracked,
  type ElementRef,
  type Signal,
} from '@angular/core';

import type { CngxListboxSearch } from '@cngx/common/interactive';

import { isEmptyScalar } from './internal/compare';

/**
 * Inputs an input-trigger composite hands to its display binding.
 *
 * `CngxTypeahead` and `CngxActionSelect` pass it, the two hosts whose trigger
 * is a text field showing the committed value. A consumer meets this shape
 * only when it replaces the binding through
 * {@link CNGX_DISPLAY_BINDING_FACTORY}. The binding never writes into the
 * field while it has focus, so a formatter change cannot overwrite what the
 * user is typing.
 */
export interface DisplayBindingOptions<T> {
  /** Committed value, mirrored into the input as display text while unfocused. */
  readonly value: Signal<T | undefined>;
  /**
   * Formatter for the input text. Tracked: a new formatter rewrites the
   * unfocused input even when the value is unchanged, so a source should
   * hand out a new function only when the text it produces changes.
   */
  readonly displayWith: Signal<(v: T) => string>;
  /** Value→input writes only fire while `false` so typing isn't clobbered. */
  readonly focused: Signal<boolean>;
  readonly inputEl: Signal<ElementRef<HTMLInputElement> | undefined>;
  readonly searchRef: Signal<CngxListboxSearch | undefined>;
  readonly searchTerm: Signal<string>;
  /** Suppress first `onUserSearchTerm` emission (hydrate-time ''). */
  readonly skipInitial: Signal<boolean>;
  /** Fires only on user writes; library writes are suppressed. */
  readonly onUserSearchTerm: (term: string) => void;
}

/**
 * Write hook and guard flag the input-trigger composites read from their
 * display binding.
 *
 * The scalar commit handler calls `writeFromValue` through `onValueWrite`
 * after a success or a rollback. The composites gate their open-on-typing
 * reaction on `isWritingFromValue`, so a library write never opens the panel.
 */
export interface DisplayBinding<T> {
  /**
   * Imperative write of `displayWith(v)` into the input + search reset.
   * Idempotent - skips when input already matches and no term pending.
   */
  writeFromValue(v: T | undefined): void;
  /**
   * `true` while a library-authored write is propagating. Gate auto-open-
   * on-typing reactions on this flag.
   */
  readonly isWritingFromValue: Signal<boolean>;
}

/**
 * Bidirectional binding between a scalar value signal and the visible
 * text of a co-located `<input>` running `CngxListboxSearch`. Two
 * `effect()`s - value→input (gated on `focused`) and search-term→callback
 * (gated on `writingFlag` + `skipInitial`).
 */
export function createDisplayBinding<T>(opts: DisplayBindingOptions<T>): DisplayBinding<T> {
  const writingFlag = signal(false);
  const hasEmittedInitial = signal(false);

  const writeFromValue = (v: T | undefined): void => {
    const search = opts.searchRef();
    const el = opts.inputEl()?.nativeElement;
    if (!search || !el) {
      return;
    }
    const next = isEmptyScalar(v) ? '' : opts.displayWith()(v);
    if (el.value === next && !search.hasValue()) {
      return;
    }
    // Raise the flag only when clearing actually notifies the term
    // effect, which resets it. An already-empty term does not change, the
    // effect never runs, and a raised flag would swallow the next user term.
    if (untracked(opts.searchTerm) !== '') {
      writingFlag.set(true);
    }
    search.clear();
    if (next !== '') {
      el.value = next;
    }
  };

  effect(() => {
    const v = opts.value();
    // Track the formatter too: a displayWith swap while the input is unfocused
    // and the value is unchanged must still rewrite the displayed text.
    opts.displayWith();
    untracked(() => {
      if (!opts.focused()) {
        writeFromValue(v);
      }
    });
  });

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

/**
 * Function shape a replacement display binding must have.
 *
 * `CngxTypeahead` and `CngxActionSelect` call it once during construction, in
 * an injection context, so a replacement may create effects. Provide it
 * through {@link CNGX_DISPLAY_BINDING_FACTORY}.
 */
export type CngxDisplayBindingFactory = <T>(opts: DisplayBindingOptions<T>) => DisplayBinding<T>;

/**
 * Factory for the `DisplayBinding` that writes the committed value into the
 * text input of `CngxTypeahead` and `CngxActionSelect`. Default
 * `createDisplayBinding`. Override to change how a value is formatted into the
 * input or when that write is held back while the user types.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/display-binding.ts
 * @since 0.1.0
 * @relatedTo CngxTypeahead, CngxActionSelect
 */
export const CNGX_DISPLAY_BINDING_FACTORY = new InjectionToken<CngxDisplayBindingFactory>(
  'CngxDisplayBindingFactory',
  {
    providedIn: 'root',
    factory: () => createDisplayBinding,
  },
);
