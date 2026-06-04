import { InjectionToken } from '@angular/core';

import { isOptionDisabled, type CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';
import { resolvePageJumpTarget, type TypeaheadController } from './typeahead-controller';

/**
 * Minimum disabled-shape the flat-nav strategy reads. Both
 * `ActiveDescendantItem` and `CngxOption` satisfy this via
 * {@link isOptionDisabled}.
 *
 * @category forms/select/controllers
 */
export interface CngxFlatNavListboxItem {
  readonly disabled?: boolean | (() => boolean) | null;
}

/**
 * Context passed to every {@link CngxFlatNavStrategy} method. Variant
 * builds it inside the keydown handler and dispatches the returned
 * {@link CngxFlatNavAction}.
 *
 * @category forms/select/controllers
 */
export interface CngxFlatNavContext<T> {
  /** Flat option list in listbox order. Variant's `flatOptions`. */
  readonly options: readonly CngxSelectOptionDef<T>[];

  /**
   * Items as seen by the AD directive - page-jump indices refer to THIS
   * array, which may omit entries `options` contains (filtered combobox).
   */
  readonly listboxItems: readonly CngxFlatNavListboxItem[];

  /** Index inside {@link options} for typeahead round-robin. `-1` = none. */
  readonly currentFlatIndex: number;

  /** Index inside {@link listboxItems} for page-jump clamping. `-1` = none. */
  readonly currentListboxIndex: number;

  readonly compareWith: CngxSelectCompareFn<T>;

  /** Short-circuits every callback to `noop` when `true`. */
  readonly disabled: boolean;

  /** Variant-owned controller; strategy only calls `matchFromIndex`. */
  readonly typeaheadController: TypeaheadController<T>;
}

/**
 * Strategy result. Pure policy - variant dispatches.
 *
 * @category forms/select/controllers
 */
export type CngxFlatNavAction<T> =
  /** Typeahead hit; variant runs its pick semantics. */
  | { readonly kind: 'select'; readonly option: CngxSelectOptionDef<T> }
  /** Page-jump target; variant opens panel + `ad.highlightByIndex(index)`. */
  | { readonly kind: 'highlight'; readonly index: number }
  /** No action; do not `preventDefault`. */
  | { readonly kind: 'noop' };

/**
 * Keyboard-nav policy for the flat select variants (single, multi,
 * reorderable-multi): PageUp/PageDown via {@link resolvePageJumpTarget}
 * and typeahead-while-closed via {@link TypeaheadController.matchFromIndex}.
 * Combobox / typeahead / action variants delegate to `CngxListboxSearch`
 * and don't consume this.
 *
 * @category forms/select/controllers
 */
export interface CngxFlatNavStrategy {
  /** PageUp/PageDown. Returns `highlight` with target or `noop`. */
  onPageJump<T>(ctx: CngxFlatNavContext<T>, direction: 1 | -1): CngxFlatNavAction<T>;

  /** Printable key while panel is closed. Returns `select` or `noop`. */
  onTypeaheadWhileClosed<T>(ctx: CngxFlatNavContext<T>, char: string): CngxFlatNavAction<T>;
}

/**
 * Canonical W3C listbox flat-nav: PageUp/Down step 10 with disabled
 * back-probe; typeahead delegates to the variant's
 * {@link TypeaheadController}.
 *
 * @category forms/select/controllers
 */
export function createDefaultFlatNavStrategy(
  options: { readonly pageStep?: number } = {},
): CngxFlatNavStrategy {
  const pageStep = options.pageStep ?? 10;

  return {
    onPageJump<T>(ctx: CngxFlatNavContext<T>, direction: 1 | -1): CngxFlatNavAction<T> {
      if (ctx.disabled) {
        return { kind: 'noop' };
      }
      const target = resolvePageJumpTarget(
        ctx.listboxItems,
        ctx.currentListboxIndex,
        direction,
        (item) => isOptionDisabled(item),
        pageStep,
      );
      if (target === null) {
        return { kind: 'noop' };
      }
      return { kind: 'highlight', index: target };
    },

    onTypeaheadWhileClosed<T>(ctx: CngxFlatNavContext<T>, char: string): CngxFlatNavAction<T> {
      if (ctx.disabled) {
        return { kind: 'noop' };
      }
      const match = ctx.typeaheadController.matchFromIndex(char, ctx.currentFlatIndex);
      if (!match) {
        return { kind: 'noop' };
      }
      return { kind: 'select', option: match };
    },
  };
}

/**
 * Flat-variant keyboard-nav strategy token. Default
 * {@link createDefaultFlatNavStrategy}. Override for fuzzy typeahead,
 * custom page-step, or group-aware jumps.
 *
 * @category forms/select/controllers
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/flat-nav-strategy.ts
 * @since 0.1.0
 */
export const CNGX_FLAT_NAV_STRATEGY = new InjectionToken<CngxFlatNavStrategy>(
  'CngxFlatNavStrategy',
  {
    providedIn: 'root',
    factory: () => createDefaultFlatNavStrategy(),
  },
);
