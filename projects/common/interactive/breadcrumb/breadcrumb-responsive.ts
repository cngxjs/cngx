/**
 * One width breakpoint for the responsive breadcrumb collapse: at `minWidth`
 * pixels and above, show at most `maxVisible` crumbs before the middle folds
 * into the overflow menu. A tier list is resolved by {@link resolveBreadcrumbTier}.
 */
export interface CngxBreadcrumbWidthTier {
  /** Lower bound (inclusive, px) at which this tier's `maxVisible` applies. */
  readonly minWidth: number;
  /** Crumb cap once this tier is the active one. Fed to the count-based collapse. */
  readonly maxVisible: number;
}

/**
 * Default width tiers, matching the headless `responsive-collapse` recipe: 640px
 * and up shows 6, 440px and up shows 4, anything narrower shows 2. The `0` floor
 * guarantees a match for every non-negative width.
 */
export const DEFAULT_BREADCRUMB_WIDTH_TIERS: readonly CngxBreadcrumbWidthTier[] = [
  { minWidth: 640, maxVisible: 6 },
  { minWidth: 440, maxVisible: 4 },
  { minWidth: 0, maxVisible: 2 },
];

/**
 * Pure width->count resolver: returns the `maxVisible` of the tier with the
 * highest `minWidth` that is still `<= width`. Order-independent - the tier list
 * is normalised (sorted by descending `minWidth`) before matching, so a consumer
 * may pass tiers in any order. When `width` sits below every tier's `minWidth`
 * the narrowest tier's `maxVisible` is the floor; an empty tier list yields
 * `Number.POSITIVE_INFINITY` (never collapse), leaving the trail intact.
 *
 * No DOM, no Angular - the width source (a `CngxResizeObserver`) lives in the
 * bar; this stays jsdom-testable and shared by the bar and the headless recipe.
 *
 * @category common/interactive/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb-responsive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbWidthTier, DEFAULT_BREADCRUMB_WIDTH_TIERS
 */
export function resolveBreadcrumbTier(
  width: number,
  tiers: readonly CngxBreadcrumbWidthTier[],
): number {
  if (tiers.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  const sorted = [...tiers].sort((a, b) => b.minWidth - a.minWidth);
  for (const tier of sorted) {
    if (width >= tier.minWidth) {
      return tier.maxVisible;
    }
  }
  return sorted[sorted.length - 1].maxVisible;
}
