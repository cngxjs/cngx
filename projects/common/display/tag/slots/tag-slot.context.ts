import type {
  CngxTagColor,
  CngxTagSize,
  CngxTagVariant,
} from '../tag.directive';

// Label, prefix, and suffix contexts are structurally identical today.
// Kept separate so per-slot fields (e.g. spacing on prefix, sort-direction
// on suffix) can land without breaking sibling consumers. Collapse
// trigger tracked in `display-accepted-debt.md §3`.

/**
 * Context exposed by the `*cngxTagLabel` slot — the full reactive
 * Tag state bundled so consumer templates can switch on variant /
 * colour / size / truncate without injecting the directive.
 *
 * `$implicit` is `void` because the slot has no positional payload —
 * consumers reach for the named fields below. Pattern mirrors
 * `CngxSelectInputSlotContext` in `@cngx/forms/select/shared`.
 *
 * @category common/display
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
 * @category common/display
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
 * @category common/display
 */
export interface CngxTagSuffixContext {
  readonly $implicit: void;
  readonly variant: CngxTagVariant;
  readonly color: CngxTagColor;
  readonly size: CngxTagSize;
  readonly truncate: boolean;
}
