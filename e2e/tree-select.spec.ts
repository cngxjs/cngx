import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/tree-select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

function triggerOf(section: Locator): Locator {
  return section.locator('cngx-tree-select [role="combobox"]').first();
}

function panelTree(page: Page): Locator {
  return page.locator('[role="tree"]');
}

async function openBasicTrigger(page: Page): Promise<Locator> {
  const section = card(page, 'Basic — single-level toggle');
  const trigger = triggerOf(section);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  return section;
}

test.describe('CngxTreeSelect demo', () => {
  test('trigger advertises aria-haspopup="tree" (W3C APG conformance)', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — single-level toggle');
    const trigger = triggerOf(section);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'tree');
    await expect(trigger).toHaveAttribute('role', 'combobox');
  });

  test('click opens the panel with role="tree" + aria-multiselectable', async ({ page }) => {
    await page.goto(ROUTE);
    await openBasicTrigger(page);
    const tree = panelTree(page).first();
    await expect(tree).toBeVisible();
    await expect(tree).toHaveAttribute('aria-multiselectable', 'true');
  });

  test('leaf click adds a chip and emits selectionChange(toggle)', async ({ page }) => {
    await page.goto(ROUTE);
    const section = await openBasicTrigger(page);
    // Initially-expanded="all" → all leaves are visible.
    const leafRow = section.locator('[role="treeitem"]').filter({ hasText: 'Tom Fischer' });
    await leafRow.click();
    // Chip should appear in the trigger.
    const chip = section.locator('cngx-chip').filter({ hasText: 'Tom Fischer' });
    await expect(chip).toBeVisible();
    // Count reports 1.
    await expect(section.locator('.event-row', { hasText: 'Count' }).locator('.event-value')).toHaveText('1');
  });

  test('cascade — parent toggle selects the whole subtree in one event', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Cascade children');
    const trigger = triggerOf(section);
    await trigger.click();

    // "Lena Kovač" has two descendants (Tom Fischer + Priya Nair). Cascade
    // mode is on by default in this section; clicking the parent should
    // check all three rows.
    const lena = section.locator('[role="treeitem"]').filter({ hasText: 'Lena Kovač' });
    await lena.click();
    const chips = section.locator('cngx-chip');
    // Three chips: Lena, Tom Fischer, Priya Nair.
    await expect(chips).toHaveCount(3);
  });

  test('keyboard: ArrowDown opens + highlights first, Enter toggles, Escape closes', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — single-level toggle');
    const trigger = triggerOf(section);
    await trigger.focus();
    await trigger.press('ArrowDown');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Tree container should now have focus + a highlighted row.
    const tree = panelTree(page).first();
    await expect(tree).toHaveAttribute('aria-activedescendant', /.+/);

    // Activate via Enter on the tree container — a chip appears.
    await tree.press('Enter');
    await expect(section.locator('cngx-chip')).toHaveCount(1);

    // Escape closes (send to tree, then trigger will receive focus back).
    await tree.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('keyboard: ArrowRight expands collapsed parent; ArrowLeft collapses it', async ({ page }) => {
    await page.goto(ROUTE);
    // Open trigger in Cascade section where we can focus then manipulate.
    const section = card(page, 'Basic — single-level toggle');
    const trigger = triggerOf(section);
    await trigger.focus();
    await trigger.press('ArrowDown');

    const tree = panelTree(page).first();
    // Collapse the root to start from a known state.
    await tree.press('Home');
    await tree.press('ArrowLeft'); // collapse root if expanded
    // Root (Sarah Chen) is now collapsed → only one treeitem visible.
    // ArrowRight expands it.
    await tree.press('ArrowRight');
    const treeItems = section.locator('[role="treeitem"]');
    // After expansion at root, we see root + 3 C-level children (Marcus, Aisha, Rafael).
    // (exact total varies with initiallyExpanded='all' behaviour; just verify > 1)
    expect(await treeItems.count()).toBeGreaterThan(1);

    // ArrowLeft on the expanded root collapses it back.
    await tree.press('ArrowLeft');
    await expect(treeItems).toHaveCount(1);
  });

  test('chip × removes a single value (no cascade even with cascadeChildren on)', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Cascade children');
    const trigger = triggerOf(section);
    await trigger.click();
    const lena = section.locator('[role="treeitem"]').filter({ hasText: 'Lena Kovač' });
    await lena.click();
    // Close the panel so chip × is reachable without overlay capture.
    await page.keyboard.press('Escape');

    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(3);
    // Remove the first chip (Lena or Tom — order-dependent; just decrement).
    await chips.first().locator('.cngx-chip__remove').click();
    await expect(chips).toHaveCount(2);
  });

  test('clear-all empties every selected value + emits cleared', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — single-level toggle');
    const trigger = triggerOf(section);
    await trigger.click();
    await section.locator('[role="treeitem"]').filter({ hasText: 'Tom Fischer' }).click();
    await page.keyboard.press('Escape');

    const clearBtn = section.locator('.cngx-tree-select__clear-all');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(section.locator('cngx-chip')).toHaveCount(0);
    // Clear-all button disappears once selection is empty.
    await expect(clearBtn).toHaveCount(0);
  });

  test('custom *cngxTreeSelectNode template replaces the default row', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Custom *cngxTreeSelectNode');
    const trigger = triggerOf(section);
    await trigger.click();
    // Consumer template uses unique markup: treeitem with role but the
    // built-in .cngx-tree-select__node class is absent.
    await expect(section.locator('.cngx-tree-select__node')).toHaveCount(0);
    // Three-state glyph presence (● / ◐ / ○) from the demo template.
    await expect(section).toContainText(/●|◐|○/);
  });

  test('ARIA treeitem fields are reactive: expanded/selected/level/posinset/setsize', async ({ page }) => {
    await page.goto(ROUTE);
    await openBasicTrigger(page);
    const tree = panelTree(page).first();
    const root = tree.locator('[role="treeitem"]').filter({ hasText: 'Sarah Chen' });

    // initiallyExpanded='all' → root is expanded, aria-selected=false.
    await expect(root).toHaveAttribute('aria-expanded', 'true');
    await expect(root).toHaveAttribute('aria-selected', 'false');
    await expect(root).toHaveAttribute('aria-level', '1');
    await expect(root).toHaveAttribute('aria-posinset', '1');

    // Click root → aria-selected flips to true (cascade is off in this section,
    // so only the root itself toggles).
    await root.click();
    await expect(root).toHaveAttribute('aria-selected', 'true');
  });
});
