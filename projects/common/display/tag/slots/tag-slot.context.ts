import type {
  CngxTagColor,
  CngxTagSize,
  CngxTagVariant,
} from '../tag.directive';

/**
 * Shared context exposed by the three `CngxTag` slots (`*cngxTagLabel`,
 * `*cngxTagPrefix`, `*cngxTagSuffix`) - the full reactive Tag state
 * bundled so consumer templates can switch on variant / colour / size /
 * truncate without injecting the directive.
 *
 * `$implicit` is `void` because the slots have no positional payload -
 * consumers reach for the named fields below. Pattern mirrors
 * `CngxSelectInputSlotContext` in `@cngx/forms/select/shared`.
 *
 * The per-slot names below alias this interface. A slot that grows its
 * own field forks its alias back into an interface extending this one -
 * sibling consumers stay source-compatible either way.
 */
export interface CngxTagSlotContext {
  readonly $implicit: void;
  readonly variant: CngxTagVariant;
  readonly color: CngxTagColor;
  readonly size: CngxTagSize;
  readonly truncate: boolean;
}

/**
 * Context of the `*cngxTagLabel` slot. Alias of {@link CngxTagSlotContext}.
 */
export type CngxTagLabelContext = CngxTagSlotContext;

/**
 * Context of the `*cngxTagPrefix` slot. Alias of {@link CngxTagSlotContext}.
 */
export type CngxTagPrefixContext = CngxTagSlotContext;

/**
 * Context of the `*cngxTagSuffix` slot. Alias of {@link CngxTagSlotContext}.
 */
export type CngxTagSuffixContext = CngxTagSlotContext;
