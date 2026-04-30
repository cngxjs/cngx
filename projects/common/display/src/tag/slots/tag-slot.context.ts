import type {
  CngxTagColor,
  CngxTagSize,
  CngxTagVariant,
} from '../tag.directive';

// Phase 1 ships three structurally-identical context interfaces
// (`CngxTagLabelContext` / `CngxTagPrefixContext` / `CngxTagSuffixContext`).
// Kept as separate exported names so future per-slot fields (e.g. spacing
// tokens on prefix, sort-direction on suffix) can land without breaking
// label-slot consumers — divergence is the design intent, not the
// current state.
//
// TODO(post-Phase-4 review): if this trio is still byte-identical after
// Phase 4 ships and no consumer-driven divergence pressure has surfaced,
// collapse into a single `CngxTagSlotContext` plus type aliases. The
// three-name surface is an extensibility hedge — re-evaluate against
// real consumer signal, not speculative.

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
