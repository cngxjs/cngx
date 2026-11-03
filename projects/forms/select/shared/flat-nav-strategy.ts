import { InjectionToken } from '@angular/core';

import { isOptionDisabled, type CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './internal/select-core';
import { resolvePageJumpTarget, type TypeaheadController } from './typeahead-controller';

/**
 * Minimum disabled-shape the flat-nav strategy reads. Both
 * `ActiveDescendantItem` and `CngxOption` satisfy this via
 * {@link isOptionDisabled}.
 */
export interface CngxFlatNavListboxItem {
  readonly disabled?: boolean | (() => boolean) | null;
}

/**
 * Context passed to every {@link CngxFlatNavStrategy} method. Variant
 * builds it inside the keydown handler and dispatches the returned
 * {@link CngxFlatNavAction}.
 */
export interface CngxFlatNavContext<T> {
  /** Flat option list in listbox order. Variant's `flatOptions`. */
  readonly options: readonly CngxSelectOptionDef<T>[];

  /**
   * Items in the AD index space - page-jump indices refer to THIS array,
   * which may omit entries `options` contains (filtered combobox). Under
   * virtualisation it is the full list, so indices are absolute, not
   * relative to the rendered window.
   */
  readonly listboxItems: readonly CngxFlatNavListboxItem[];

  /** Index inside {@link options} for typeahead round-robin. `-1` = none. */
  readonly currentFlatIndex: number;

  /**
   * Index inside {@link listboxItems} (the AD index space, absolute under
   * virtualisation) for page-jump clamping. `-1` = none.
   */
  readonly currentListboxIndex: number;

  readonly compareWith: CngxSelectCompareFn<T>;

  /** Short-circuits every callback to `noop` when `true`. */
  readonly disabled: boolean;

  /** Variant-owned controller; strategy only calls `matchFromIndex`. */
  readonly typeaheadController: TypeaheadController<T>;
}

/**
 * Strategy result. Pure policy - variant dispatches.
 */
export type CngxFlatNavAction<T> =
  /** Typeahead hit; variant runs its pick semantics. */
  | { readonly kind: 'select'; readonly option: CngxSelectOptionDef<T> }
  /** Page-jump target; variant opens panel + `ad.highlightByIndex(index)`. */
  | { readonly kind: 'highlight'; readonly index: number }
  /** No action; do not `preventDefault`. */
  | { readonly kind: 'noop' };

/**
 * Keyboard-nav policy for the flat select variants: PageUp/PageDown via
 * {@link resolvePageJumpTarget} on all eight flat variants, and
 * typeahead-while-closed via {@link TypeaheadController.matchFromIndex} on
 * the button-trigger ones (single, multi, reorderable-multi, shell). The
 * input variants (combobox, typeahead, action-select, action-multi-select)
 * filter through `CngxListboxSearch` instead, so `onTypeaheadWhileClosed`
 * never runs for them and their context carries a controller that matches
 * nothing.
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
 * `createDefaultFlatNavStrategy`. Override for fuzzy typeahead, custom
 * page-step, or group-aware jumps.
 *
 * Reach: every flat composite routes PageUp/PageDown through `onPageJump`,
 * the four button-trigger ones (`CngxSelect`, `CngxMultiSelect`,
 * `CngxReorderableMultiSelect`, `CngxSelectShell`) and the four input
 * variants (`CngxCombobox`, `CngxTypeahead`, `CngxActionSelect`,
 * `CngxActionMultiSelect`), whose text input keeps the caret and handles the
 * key from its own keydown. Closed-trigger typeahead (`onTypeaheadWhileClosed`)
 * runs on the button-trigger composites only; the input owns typing on the
 * others. `CngxTreeSelect` navigates its tree through
 * `CNGX_HIERARCHICAL_NAV_STRATEGY` instead.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/flat-nav-strategy.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxCombobox, CngxTypeahead, CngxActionSelect, CngxActionMultiSelect
 */
export const CNGX_FLAT_NAV_STRATEGY = new InjectionToken<CngxFlatNavStrategy>(
  'CngxFlatNavStrategy',
  {
    providedIn: 'root',
    factory: () => createDefaultFlatNavStrategy(),
  },
);
