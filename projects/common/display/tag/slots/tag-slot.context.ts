import type {
  CngxTagColor,
  CngxTagSize,
  CngxTagVariant,
} from '../tag.directive';

// Phase 1 ships three structurally-identical context interfaces
// (`CngxTagLabelContext` / `CngxTagPrefixContext` / `CngxTagSuffixContext`).
// Kept as separate exported names so future per-slot fields (e.g.
// spacing tokens on prefix, sort-direction on suffix) can land without
// breaking sibling consumers — divergence is the design intent, not
// the current state.
//
// Re-evaluation tracked in
// `.internal/architektur/display-accepted-debt.md §3` (slot-context
// structural-identity headroom). Collapse to a single
// `CngxTagSlotContext` plus type aliases when the §3 trigger fires —
// the entry pairs this trio with the Group-side header/accessory
// pair so a single re-evaluation covers both files.

/**
 * Context exposed by the `*cngxTagLabel` slot — the full reactive
 * Tag state bundled so consumer templates can switch on variant /
 * colour / size / truncate without injecting the directive.
 *
 * `$implicit` is `void` because the slot has no positional payload —
 * consumers reach for the named fields below. Pattern mirrors
 * `CngxSelectInputSlotContext` in `@cngx/forms/select/shared`.
 *
 * @category display
 */
export interface CngxTagLabelContext {
  readonly $implicit: void;
  readonly variant: CngxTagVariant;
  readonly color: CngxTagColor;
  readonly size: CngxTagSize;
  readonly truncate: boolean;
}

/**
 * Context exposed by the `*cngxTagPrefix` slot. Structurally
 * identical to {@link CngxTagLabelContext}; kept as a separate
 * interface so future per-slot fields (e.g. spacing tokens) can
 * land without breaking label-slot consumers.
 *
 * @category display
 */
export interface CngxTagPrefixContext {
  readonly $implicit: void;
  readonly variant: CngxTagVariant;
  readonly color: CngxTagColor;
  readonly size: CngxTagSize;
  readonly truncate: boolean;
}

/**
 * Context exposed by the `*cngxTagSuffix` slot. Structurally
 * identical to {@link CngxTagLabelContext}; kept as a separate
 * interface so future per-slot fields can land without breaking
 * label-slot consumers.
 *
 * @category display
 */
export interface CngxTagSuffixContext {
  readonly $implicit: void;
  readonly variant: CngxTagVariant;
  readonly color: CngxTagColor;
  readonly size: CngxTagSize;
  readonly truncate: boolean;
}
