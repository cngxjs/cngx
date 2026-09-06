import type { CngxTagGroupAlign, CngxTagGroupGap } from '../tag-group.component';

/**
 * Shared context exposed by the two `CngxTagGroup` slots
 * (`*cngxTagGroupHeader`, `*cngxTagGroupAccessory`) - the full reactive
 * group state plus the live `count` of projected `CngxTag` children.
 * Lets consumer headers render `"Filters ({{ count }})"` without
 * injecting the group.
 *
 * `$implicit` is `void` because the slots have no positional payload -
 * consumers reach for the named fields below.
 *
 * The per-slot names below alias this interface. A slot that grows its
 * own field (e.g. `position` on accessory) forks its alias back into an
 * interface extending this one - sibling consumers stay
 * source-compatible either way.
 *
 * @category common/display
 */
export interface CngxTagGroupSlotContext {
  readonly $implicit: void;
  readonly gap: CngxTagGroupGap;
  readonly align: CngxTagGroupAlign;
  readonly semanticList: boolean;
  readonly label: string | undefined;
  readonly count: number;
}

/**
 * Context of the `*cngxTagGroupHeader` slot. Alias of
 * {@link CngxTagGroupSlotContext}.
 *
 * @category common/display
 */
export type CngxTagGroupHeaderContext = CngxTagGroupSlotContext;

/**
 * Context of the `*cngxTagGroupAccessory` slot. Alias of
 * {@link CngxTagGroupSlotContext}.
 *
 * @category common/display
 */
export type CngxTagGroupAccessoryContext = CngxTagGroupSlotContext;
