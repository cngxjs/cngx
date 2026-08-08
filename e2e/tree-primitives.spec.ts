import { expect, test, type Locator, type Page } from '@playwright/test';

// Post examples-app migration the old single `tree-primitives` card page
// was split into per-example leaf routes. Each test navigates to the
// leaf whose artifact demonstrates the behaviour it asserts. Locators are
// scoped to `.cngx-ex-artifact` so intro/code-panel text can never match.

const EXPANDABLE =
  '/#/common/interactive/expandable/controlled-by-external-state';
const TREE_CONTROLLER =
  '/#/common/interactive/tree/controller/basic-expand-collapse';
const HIERARCHICAL_NAV =
  '/#/common/interactive/tree/hierarchical-nav/with-active-descendant';
const CASCADE =
  '/#/common/interactive/tree-primitives/cascade-selection-with-indeterminate-propagation';

function artifact(page: Page): Locator {
  return page.locator('.cngx-ex-artifact');
}

test.describe('Tree primitives demo', () => {
  test('CngxExpandable — aria-expanded mirrors the controlled state', async ({
    page,
  }) => {
    await page.goto(EXPANDABLE);
    // The demo renders rows row-a (initially expanded), row-b, row-c
    // (collapsed). Exercise a collapsed row so the toggle drives
    // aria-expanded from false -> true.
    const host = artifact(page).locator('[cngxExpandable]').nth(1);
    await expect(host).toHaveAttribute('aria-expanded', 'false');
    await expect(host).toHaveAttribute('aria-controls', 'row-b-content');

    // Content panel carries `[hidden]` while collapsed.
    const panel = artifact(page).locator('#row-b-content');
    await expect(panel).toBeHidden();

    // The demo's toggle button drives state externally.
    await artifact(page)
      .getByRole('button', { name: 'Toggle row-b' })
      .click();
    await expect(host).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
  });

  test('createTreeController — expandAll shows every descendant, collapseAll hides them', async ({
    page,
  }) => {
    await page.goto(TREE_CONTROLLER);
    // Rows are rendered as <li> elements. The controls (Expand all /
    // Collapse all) live in the example chrome, outside the artifact.
    const rows = artifact(page).locator('ul[role="list"] li');
    // Initial render: two roots (Documents, Photos) + the first root's
    // two children (it starts expanded) = 4 visible.
    await expect(rows).toHaveCount(4);
    await page.getByRole('button', { name: 'Expand all' }).click();
    // expandAll reveals every descendant.
    await expect(rows).toHaveCount(8);
    await page.getByRole('button', { name: 'Collapse all' }).click();
    // Only the two root-level nodes remain.
    await expect(rows).toHaveCount(2);
  });

  test('keyboard: AD+HierarchicalNav navigate, expand, collapse', async ({
    page,
  }) => {
    await page.goto(HIERARCHICAL_NAV);
    const tree = artifact(page).locator('[role="tree"]').first();
    const treeItems = artifact(page).locator('[role="treeitem"]');
    await treeItems.first().waitFor();
    await tree.focus();

    // This example does not opt into autoHighlightFirst, so focus alone
    // leaves aria-activedescendant empty; Home establishes the cursor on
    // the top row (and exercises the Home = first-row semantics).
    await tree.press('Home');
    await expect(tree).toHaveAttribute('aria-activedescendant', /.+/);
    const topActive = await tree.getAttribute('aria-activedescendant');
    expect(topActive).toBeTruthy();

    // ArrowDown moves the active descendant to the next visible row.
    await tree.press('ArrowDown');
    await expect(tree).not.toHaveAttribute(
      'aria-activedescendant',
      topActive ?? '',
    );

    // Home jumps back to the top.
    await tree.press('Home');
    await expect(tree).toHaveAttribute(
      'aria-activedescendant',
      topActive ?? '',
    );

    // ArrowLeft collapses the current expanded root.
    const visibleBefore = await treeItems.count();
    await tree.press('ArrowLeft');
    await expect
      .poll(async () => await treeItems.count())
      .toBeLessThan(visibleBefore);

    // ArrowRight re-expands it.
    await tree.press('ArrowRight');
    await expect
      .poll(async () => await treeItems.count())
      .toBe(visibleBefore);
  });

  test('cascade selection — clicking a parent flips all descendants + propagates indeterminate up', async ({
    page,
  }) => {
    await page.goto(CASCADE);
    // The cascade demo is a single naked page; scope to its <main>
    // (artifact tree + the Count readout in the chrome section).
    const section = page.locator('main');
    // Leaf-selected pre-seed: "Wireframes" is checked → parent "Design" is
    // indeterminate, grandparent "Project Alpha" indeterminate.
    const design = section
      .locator('[role="treeitem"]')
      .filter({ hasText: 'Design' })
      .first();
    // Indeterminate glyph "◐" visible pre-cascade.
    await expect(design).toContainText('◐');

    // Click "Design" → cascade selects Design + both of its children.
    await design.click();
    await expect(design).toContainText('●');
    // "Wireframes" + "Visual design" leaf rows now selected.
    await expect(
      section.locator('[role="treeitem"]').filter({ hasText: 'Wireframes' }),
    ).toContainText('●');
    await expect(
      section.locator('[role="treeitem"]').filter({ hasText: 'Visual design' }),
    ).toContainText('●');

    // Cascade added Design + "Visual design"; Wireframes was already
    // selected. Total selected = 3 ("3 / <flat-count>" in the event row).
    const count = section
      .locator('.event-row', { hasText: 'Count' })
      .locator('.event-value');
    await expect(count).toContainText(/^3\s*\//);
  });
});
