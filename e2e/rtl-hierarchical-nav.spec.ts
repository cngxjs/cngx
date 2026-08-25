import { expect, test, type Locator, type Page } from '@playwright/test';

// RTL keyboard contract for the standalone CngxHierarchicalNav tree. The
// Phase-5 coverage sweep found this route uncovered: the tree-select spec
// exercises the same tree strategy, but through the select panel DOM on a
// different route, so the standalone role="tree" surface had no RTL proof.
// Flipping html[dir="rtl"] at runtime must invert the physical expand /
// collapse arrows per the WAI-ARIA APG treeview pattern while the block axis
// (ArrowUp / ArrowDown, Home / End) stays fixed. Mirrors the runtime-flip
// pattern in e2e/css-contract-rtl.spec.ts and the tree-select case in
// e2e/rtl-keyboard-listbox-menu-tree.spec.ts.

const ROUTE = '/#/common/interactive/tree/hierarchical-nav/with-active-descendant';

function setRtl(page: Page): Promise<void> {
  return page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
}

test.describe('RTL keyboard navigation: standalone hierarchical-nav tree', () => {
  test('ArrowRight collapses an open parent, ArrowLeft expands it', async ({ page }) => {
    await page.goto(ROUTE);
    await setRtl(page);

    const tree: Locator = page.locator('[role="tree"]').first();
    await expect(tree).toBeVisible();

    // The active-descendant cursor lives on the tree; Home lands it on the
    // first visible node, `src`, which starts expanded (initiallyExpanded).
    await tree.press('Home');
    const src: Locator = tree.locator('[role="treeitem"][id="src"]');
    await expect(src).toHaveAttribute('aria-expanded', 'true');

    // rtl: physical ArrowRight is inline-back -> collapse the open parent.
    await tree.press('ArrowRight');
    await expect(src).toHaveAttribute('aria-expanded', 'false');

    // rtl: physical ArrowLeft is inline-forward -> expand the collapsed parent.
    await tree.press('ArrowLeft');
    await expect(src).toHaveAttribute('aria-expanded', 'true');
  });
});
