import { InjectionToken } from '@angular/core';

import type { ActiveDescendantItem } from '@cngx/common/a11y';

import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCompareFn } from './select-core';
import {
  resolvePageJumpTarget,
  type TypeaheadController,
} from './typeahead-controller';

/**
 * Context passed to every {@link CngxFlatNavStrategy} method. Bundles the
 * pure inputs a keyboard-nav policy needs to decide what to do next
 * without binding the policy to any particular component's internals.
 *
 * Consumer responsibility: build this context at the call-site (inside
 * the trigger keydown handler), invoke the strategy, then dispatch the
 * returned {@link CngxFlatNavAction} in a variant-appropriate way
 * (single-select → `value.set(...)`; multi-select → `toggleOptionByUser`;
 * both → `panel.open(); ad.highlightByIndex(...)` for the highlight path).
 *
 * @category interactive
 */
export interface CngxFlatNavContext<T> {
  /**
   * Flat option list in listbox order — used by typeahead round-robin.
   * Always the variant's `flatOptions` from `CngxSelectCore`.
   */
  readonly options: readonly CngxSelectOptionDef<T>[];

  /**
   * Listbox items (`ActiveDescendantItem[]`) as seen by the AD directive
   * — the PageUp/PageDown target indices refer to THIS array because the
   * listbox may omit items that `flatOptions` contains (e.g. during
   * filtered combobox navigation).
   *
   * Pass `lb.options()` from the variant's `CngxListbox` viewchild.
   */
  readonly listboxItems: readonly ActiveDescendantItem[];

  /**
   * Current index inside {@link options} — used for typeahead round-robin
   * ("from here, find the next matching option"). `-1` = no current.
   */
  readonly currentFlatIndex: number;

  /**
   * Current index inside {@link listboxItems} — used for page-jump
   * clamping + disabled-aware back-probe. `-1` = no current highlight.
   */
  readonly currentListboxIndex: number;

  /** Element-wise equality from the variant's `compareWith` input. */
  readonly compareWith: CngxSelectCompareFn<T>;

  /** When `true`, the strategy short-circuits every callback to `noop`. */
  readonly disabled: boolean;

  /**
   * Typeahead controller owned by the variant (via
   * {@link createTypeaheadController}). The strategy invokes
   * `matchFromIndex` on it — keeps the controller's buffer + debounce
   * lifecycle with the variant.
   */
  readonly typeaheadController: TypeaheadController<T>;
}

/**
 * Discriminated result the variant dispatches after calling the strategy.
 * The strategy is **pure policy** — it never touches component state,
 * the popover, or the listbox. Returning `'noop'` means the variant does
 * nothing (the key was handled without effect).
 *
 * @category interactive
 */
export type CngxFlatNavAction<T> =
  /** Typeahead hit. Variant dispatches variant-specific pick semantics
   *  (single → set value + emit; multi → toggleOptionByUser). */
  | { readonly kind: 'select'; readonly option: CngxSelectOptionDef<T> }
  /** Page-jump target. Variant opens the panel if closed and calls
   *  `ad.highlightByIndex(index)`. */
  | { readonly kind: 'highlight'; readonly index: number }
  /** No action. Variant should not `preventDefault` the original event. */
  | { readonly kind: 'noop' };

/**
 * Keyboard-nav policy shared by the flat select variants (single,
 * multi, reorderable-multi). Deliberately scoped to the two cases where
 * the variants previously carried near-identical boilerplate:
 *
 *   - **PageUp / PageDown** — open + jump ±N clamped with disabled
 *     back-probe (via {@link resolvePageJumpTarget}).
 *   - **Typeahead-while-closed** — panel is closed, user taps a
 *     printable char; match first non-disabled option via the
 *     variant's {@link TypeaheadController}.
 *
 * Combobox / typeahead / action-variants are NOT intended consumers —
 * those variants already delegate to `CngxListboxSearch` for keyboard
 * input and have no need for this token. The strategy is DI-overridable
 * so enterprise apps can inject a fuzzy typeahead, a custom page-step,
 * or a group-aware page-jump without forking the flat variants.
 *
 * @category interactive
 */
export interface CngxFlatNavStrategy {
  /**
   * Handle `PageUp` / `PageDown` inside the trigger. Returns a
   * `'highlight'` action with the clamped target index, or `'noop'`
   * when no valid (non-disabled) target exists.
   */
  onPageJump<T>(
    ctx: CngxFlatNavContext<T>,
    direction: 1 | -1,
  ): CngxFlatNavAction<T>;

  /**
   * Handle a printable keystroke while the panel is closed. Returns a
   * `'select'` action with the matched option, or `'noop'` for
   * non-printable chars, disabled states, or no match.
   */
  onTypeaheadWhileClosed<T>(
    ctx: CngxFlatNavContext<T>,
    char: string,
  ): CngxFlatNavAction<T>;
}

/**
 * Default strategy implementing the canonical W3C listbox behaviour
 * that the three flat variants previously inlined:
 *
 *   - PageUp/Down jump step = 10, clamped to list bounds, skips
 *     disabled entries with a back-probe fallback.
 *   - Typeahead-while-closed defers entirely to
 *     {@link TypeaheadController.matchFromIndex} — the controller's
 *     printable-char guard, lower-case match, debounced buffer reset,
 *     and disabled-skip logic are unchanged.
 *
 * Consumers override the {@link CNGX_FLAT_NAV_STRATEGY} DI token to
 * swap out the policy wholesale — the strategy is opaque so enterprise
 * overrides can introduce fuzzy match or group-boundary navigation
 * without touching any variant.
 *
 * @category interactive
 */
export function createDefaultFlatNavStrategy(
  options: { readonly pageStep?: number } = {},
): CngxFlatNavStrategy {
  const pageStep = options.pageStep ?? 10;

  return {
    onPageJump<T>(
      ctx: CngxFlatNavContext<T>,
      direction: 1 | -1,
    ): CngxFlatNavAction<T> {
      if (ctx.disabled) {
        return { kind: 'noop' };
      }
      const target = resolvePageJumpTarget(
        ctx.listboxItems,
        ctx.currentListboxIndex,
        direction,
        (item) => !!item.disabled,
        pageStep,
      );
      if (target === null) {
        return { kind: 'noop' };
      }
      return { kind: 'highlight', index: target };
    },

    onTypeaheadWhileClosed<T>(
      ctx: CngxFlatNavContext<T>,
      char: string,
    ): CngxFlatNavAction<T> {
      if (ctx.disabled) {
        return { kind: 'noop' };
      }
      const match = ctx.typeaheadController.matchFromIndex(
        char,
        ctx.currentFlatIndex,
      );
      if (!match) {
        return { kind: 'noop' };
      }
      return { kind: 'select', option: match };
    },
  };
}

/**
 * DI token resolving the policy used by the flat select variants for
 * PageUp/Down and typeahead-while-closed. Defaults to
 * {@link createDefaultFlatNavStrategy}; override app-wide via
 * `providers: [{ provide: CNGX_FLAT_NAV_STRATEGY, useValue: customStrategy }]`
 * or per-component via `viewProviders` to inject fuzzy typeahead,
 * custom page-step, group-aware jumps, or telemetry hooks — without
 * forking any variant.
 *
 * Symmetrical to `CNGX_CHIP_REMOVAL_HANDLER_FACTORY` — the two tokens
 * are the Phase-1 primitives that the Phase-2 refactor consumes.
 *
 * @category interactive
 */
export const CNGX_FLAT_NAV_STRATEGY = new InjectionToken<CngxFlatNavStrategy>(
  'CngxFlatNavStrategy',
  {
    providedIn: 'root',
    factory: () => createDefaultFlatNavStrategy(),
  },
);
