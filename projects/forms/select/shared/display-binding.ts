import {
  effect,
  InjectionToken,
  signal,
  untracked,
  type ElementRef,
  type Signal,
} from '@angular/core';

import type { CngxListboxSearch } from '@cngx/common/interactive';

/**
 * Configuration for {@link createDisplayBinding}.
 *
 * @category forms/select/state
 */
export interface DisplayBindingOptions<T> {
  /** Committed value, mirrored into the input as display text while unfocused. */
  readonly value: Signal<T | undefined>;
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
 * API returned from {@link createDisplayBinding}.
 *
 * @category forms/select/state
 */
export interface DisplayBinding<T> {
  /**
   * Imperative write of `displayWith(v)` into the input + search reset.
   * Idempotent — skips when input already matches and no term pending.
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
 * `effect()`s — value→input (gated on `focused`) and search-term→callback
 * (gated on `writingFlag` + `skipInitial`).
 *
 * @category forms/select/state
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

  effect(() => {
    const v = opts.value();
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
 * Factory signature for {@link CNGX_DISPLAY_BINDING_FACTORY}.
 *
 * @category forms/select/state
 */
export type CngxDisplayBindingFactory = <T>(
  opts: DisplayBindingOptions<T>,
) => DisplayBinding<T>;

/**
 * Factory token for {@link DisplayBinding}. Default
 * {@link createDisplayBinding}.
 *
 * @category forms/select/state
 */
export const CNGX_DISPLAY_BINDING_FACTORY =
  new InjectionToken<CngxDisplayBindingFactory>('CngxDisplayBindingFactory', {
    providedIn: 'root',
    factory: () => createDisplayBinding,
  });
