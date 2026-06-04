import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/common/interactive/tree-primitives';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('Tree primitives demo', () => {
  test('CngxExpandable — aria-expanded mirrors the controlled state', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'CngxExpandable — passive expansion atom');
    const host = section.locator('[cngxExpandable]');
    await expect(host).toHaveAttribute('aria-expanded', 'false');
    await expect(host).toHaveAttribute('aria-controls', 'exp-panel-1');

    // Content panel carries `[hidden]` while collapsed.
    const panel = section.locator('#exp-panel-1');
    await expect(panel).toBeHidden();

    // The demo's toggle button drives state externally.
    await section.getByRole('button', { name: /Details/ }).click();
    await expect(host).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
  });

  test('createTreeController — expandAll shows every descendant, collapseAll hides them', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'createTreeController — flat projection');
    // Rows are rendered as <li> elements; count visible-nodes before + after expandAll.
    const rows = section.locator('ul li');
    const initial = await rows.count();
    await section.getByRole('button', { name: 'Expand all' }).click();
    const expanded = await rows.count();
    expect(expanded).toBeGreaterThan(initial);
    await section.getByRole('button', { name: 'Collapse all' }).click();
    // Only root-level nodes remain.
    await expect(rows).toHaveCount(1);
  });

  test('keyboard: AD+HierarchicalNav navigate, expand, collapse', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Full W3C treeview keyboard');
    const tree = section.locator('[role="tree"]').first();
    await tree.focus();

    // Snapshot the initial active id (autoHighlightFirst).
    const initialActive = await tree.getAttribute('aria-activedescendant');
    expect(initialActive).toBeTruthy();

    // ArrowDown moves to the next visible row.
    await tree.press('ArrowDown');
    const afterDown = await tree.getAttribute('aria-activedescendant');
    expect(afterDown).not.toBe(initialActive);

    // Home jumps back to the top.
    await tree.press('Home');
    await expect(tree).toHaveAttribute('aria-activedescendant', initialActive ?? '');

    // ArrowLeft collapses the current expanded root.
    const visibleBefore = await section.locator('[role="treeitem"]').count();
    await tree.press('ArrowLeft');
    const visibleAfterCollapse = await section.locator('[role="treeitem"]').count();
    expect(visibleAfterCollapse).toBeLessThan(visibleBefore);

    // ArrowRight re-expands it.
    await tree.press('ArrowRight');
    const visibleAfterExpand = await section.locator('[role="treeitem"]').count();
    expect(visibleAfterExpand).toBe(visibleBefore);
  });

  test('cascade selection — clicking a parent flips all descendants + propagates indeterminate up', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Cascade selection');
    // Leaf-selected pre-seed: "Wireframes" is checked → parent "Design" is
    // indeterminate, grandparent "Project Alpha" indeterminate.
    const design = section.locator('[role="treeitem"]').filter({ hasText: 'Design' }).first();
    // Indeterminate glyph "◐" visible pre-cascade.
    await expect(design).toContainText('◐');

    // Click "Design" → cascade selects Design + both of its children.
    await design.click();
    await expect(design).toContainText('●');
    // "Wireframes" + "Visual design" leaf rows now selected.
    await expect(section.locator('[role="treeitem"]').filter({ hasText: 'Wireframes' })).toContainText('●');
    await expect(section.locator('[role="treeitem"]').filter({ hasText: 'Visual design' })).toContainText('●');

    // Cascade added Design + "Visual design"; Wireframes was already
    // selected. Total selected = 3 ("3 / <flat-count>" in the event row).
    const count = section.locator('.event-row', { hasText: 'Count' }).locator('.event-value');
    await expect(count).toContainText(/^3\s*\//);
  });
});
