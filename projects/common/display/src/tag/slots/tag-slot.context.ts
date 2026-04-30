import type {
  CngxTagColor,
  CngxTagSize,
  CngxTagVariant,
} from '../tag.directive';

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
