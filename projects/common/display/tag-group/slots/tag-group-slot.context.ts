import type {
  CngxTagGroupAlign,
  CngxTagGroupGap,
} from '../tag-group.component';

// Header and accessory contexts are structurally identical today.
// Kept separate so per-slot fields (e.g. `position` on accessory) can
// land without breaking sibling consumers. Mirrors `tag-slot.context.ts`.
// Collapse trigger tracked in `display-accepted-debt.md §3`.

/**
 * Context exposed by the `*cngxTagGroupHeader` slot — the full
 * reactive group state plus the live `count` of projected
 * `CngxTag` children. Lets consumer headers render
 * `"Filters ({{ count }})"` without injecting the group.
 *
 * `$implicit` is `void` because the slot has no positional payload —
 * consumers reach for the named fields below.
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
 */
export interface CngxTagGroupAccessoryContext {
  readonly $implicit: void;
  readonly gap: CngxTagGroupGap;
  readonly align: CngxTagGroupAlign;
  readonly semanticList: boolean;
  readonly label: string | undefined;
  readonly count: number;
}
