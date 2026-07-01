/**
 * A collapse strategy decides which crumb indices fold into the overflow menu.
 * Pure and synchronous: given the total crumb count and the `maxVisible` cap it
 * returns the set of indices to hide. Swap it via
 * {@link CNGX_BREADCRUMB_COLLAPSE_STRATEGY} to change the rule (width-aware,
 * keep-first-N, mobile parent-only, ...) without forking {@link CngxBreadcrumb}.
 */
export type CngxBreadcrumbCollapseStrategy = (
  total: number,
  maxVisible: number,
) => ReadonlySet<number>;

const NO_COLLAPSE: ReadonlySet<number> = new Set();

/**
 * The default collapse rule: keep the first crumb and the last
 * `maxVisible - 1`, folding the middle into the overflow menu. Returns an empty
 * set when `maxVisible` is unset/invalid (`< 1`) or the trail already fits
 * (`total <= maxVisible`), so a short trail never collapses.
 *
 * @category common/interactive/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb-collapse.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CNGX_BREADCRUMB_COLLAPSE_STRATEGY
 */
export function createBreadcrumbCollapse(): CngxBreadcrumbCollapseStrategy {
  return (total, maxVisible) => {
    if (!maxVisible || maxVisible < 1 || total <= maxVisible) {
      return NO_COLLAPSE;
    }
    const keepTail = maxVisible - 1;
    const collapsed = new Set<number>();
    for (let i = 1; i < total - keepTail; i++) {
      collapsed.add(i);
    }
    return collapsed;
  };
}
