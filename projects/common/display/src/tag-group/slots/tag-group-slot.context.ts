import type {
  CngxTagGroupAlign,
  CngxTagGroupGap,
} from '../tag-group.component';

// Phase 2 ships two structurally-identical context interfaces
// (`CngxTagGroupHeaderContext` / `CngxTagGroupAccessoryContext`).
// Kept as separate exported names so future per-slot fields (e.g.
// `position` on accessories, dropdown-density on headers) can land
// without breaking sibling consumers — divergence is the design
// intent, not the current state. Mirrors the `tag-slot.context.ts`
// convention.
//
// TODO(post-Phase-4 review): if both interfaces remain byte-identical
// after Phase 4 ships and no consumer-driven divergence pressure has
// surfaced, collapse into a single `CngxTagGroupSlotContext` plus
// type aliases. Re-evaluate against real consumer signal, not
// speculative.

/**
 * Context exposed by the `*cngxTagGroupHeader` slot — the full
 * reactive group state plus the live `count` of projected
 * `CngxTag` children. Lets consumer headers render
 * `"Filters ({{ count }})"` without injecting the group.
 *
 * `$implicit` is `void` because the slot has no positional payload —
 * consumers reach for the named fields below.
 *
 * @category display
 */
export interface CngxTagGroupHeaderContext {
  readonly $implicit: void;
  readonly gap: CngxTagGroupGap;
  readonly align: CngxTagGroupAlign;
  readonly semanticList: boolean;
  readonly label: string | undefined;
  readonly count: number;
}

/**
 * Context exposed by the `*cngxTagGroupAccessory` slot. Structurally
 * identical to {@link CngxTagGroupHeaderContext}; kept separate so
 * future per-slot fields can land without breaking header-slot
 * consumers.
 *
 * @category display
 */
export interface CngxTagGroupAccessoryContext {
  readonly $implicit: void;
  readonly gap: CngxTagGroupGap;
  readonly align: CngxTagGroupAlign;
  readonly semanticList: boolean;
  readonly label: string | undefined;
  readonly count: number;
}
