import { expect, test, type Locator, type Page } from '@playwright/test';

const R = {
  basic: '/#/forms/select/tree-select/basic-single-level-toggle',
  cascade: '/#/forms/select/tree-select/cascade-children-parent-toggle-selects-the-whole-subtree',
  custom: '/#/forms/select/tree-select/custom-cngxtreeselectnode-template',
};

// One example per leaf route → scope to <main> so trigger, chips, panel tree
// and the .event-row readout all resolve without matching code panels.
function ex(page: Page): Locator {
  return page.locator('main');
}

function triggerOf(section: Locator): Locator {
  return section.locator('cngx-tree-select [role="combobox"]').first();
}

function panelTree(page: Page): Locator {
  return page.locator('[role="tree"]');
}

async function openBasicTrigger(page: Page): Promise<Locator> {
  const section = ex(page);
  const trigger = triggerOf(section);
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  return section;
}

test.describe('CngxTreeSelect demo', () => {
  test('trigger advertises aria-haspopup="tree" (W3C APG conformance)', async ({ page }) => {
    await page.goto(R.basic);
    const section = ex(page);
    const trigger = triggerOf(section);
    await expect(trigger).toHaveAttribute('aria-haspopup', 'tree');
    await expect(trigger).toHaveAttribute('role', 'combobox');
  });

  test('click opens the panel with role="tree" + aria-multiselectable', async ({ page }) => {
    await page.goto(R.basic);
    await openBasicTrigger(page);
    const tree = panelTree(page).first();
    await expect(tree).toBeVisible();
    await expect(tree).toHaveAttribute('aria-multiselectable', 'true');
  });

  test('leaf click adds a chip and emits selectionChange(toggle)', async ({ page }) => {
    await page.goto(R.basic);
    const section = await openBasicTrigger(page);
    // initiallyExpanded="all" → all leaves are visible. Toggle a single leaf.
    const leafRow = section.locator('[role="treeitem"]').filter({ hasText: 'Angular' });
    await leafRow.click();
    // Chip should appear in the trigger.
    const chip = section.locator('cngx-chip').filter({ hasText: 'Angular' });
    await expect(chip).toBeVisible();
    // Exactly one value selected.
    await expect(section.locator('cngx-chip')).toHaveCount(1);
    await expect(
      section.locator('.event-row', { hasText: 'values' }).locator('.event-value'),
    ).toHaveText('angular');
  });

  test('cascade — parent toggle selects the whole subtree in one event', async ({ page }) => {
    await page.goto(R.cascade);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();

    // "Frontend" has three leaf children (Angular, Signals, RxJS). Cascade mode
    // is on in this section; clicking the parent should check all four rows
    // (parent + three children) in one toggle.
    const frontend = section.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });
    await frontend.click();
    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(4);
  });

  test('keyboard: ArrowDown opens + highlights first, Enter toggles, Escape closes', async ({ page }) => {
    await page.goto(R.basic);
    const section = ex(page);
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
    await page.goto(R.basic);
    // Open via click so DOM focus lands on the tree with the first root active.
    const section = await openBasicTrigger(page);
    const tree = panelTree(page).first();
    const frontend = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });

    // Root starts expanded (initiallyExpanded='all'). Each key goes through
    // tree.press() so Playwright re-focuses the tree after every re-render.
    await expect(frontend).toHaveAttribute('aria-expanded', 'true');
    await tree.press('ArrowLeft');
    await expect(frontend).toHaveAttribute('aria-expanded', 'false');
    // ArrowRight re-expands the collapsed parent.
    await tree.press('ArrowRight');
    await expect(frontend).toHaveAttribute('aria-expanded', 'true');
    // ArrowLeft collapses it again.
    await tree.press('ArrowLeft');
    await expect(frontend).toHaveAttribute('aria-expanded', 'false');
  });

  test('chip × removes a single value (no cascade even with cascadeChildren on)', async ({ page }) => {
    await page.goto(R.cascade);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    const frontend = section.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });
    await frontend.click();
    // Close the panel so chip × is reachable without overlay capture.
    await page.keyboard.press('Escape');

    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(4);
    // Remove one chip — cascade must NOT fire on removal, so only one value drops.
    await chips.first().locator('.cngx-chip__remove').click();
    await expect(chips).toHaveCount(3);
  });

  test('clear-all empties every selected value + emits cleared', async ({ page }) => {
    await page.goto(R.basic);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    await section.locator('[role="treeitem"]').filter({ hasText: 'Angular' }).click();
    await page.keyboard.press('Escape');

    const clearBtn = section.locator('.cngx-tree-select__clear-all');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(section.locator('cngx-chip')).toHaveCount(0);
    // Clear-all button disappears once selection is empty.
    await expect(clearBtn).toHaveCount(0);
  });

  test('custom *cngxTreeSelectNode template replaces the default row', async ({ page }) => {
    await page.goto(R.custom);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    // Consumer template uses unique markup: treeitem keeps its role but the
    // built-in .cngx-tree-select__node class is absent.
    await expect(section.locator('.cngx-tree-select__node')).toHaveCount(0);
    // Consumer's custom row markup renders instead (row + checkbox indicator).
    await expect(section.locator('.tree-node-row').first()).toBeVisible();
    await expect(section.locator('cngx-checkbox-indicator').first()).toBeVisible();
  });

  test('ARIA treeitem fields are reactive: expanded/selected/level/posinset/setsize', async ({ page }) => {
    await page.goto(R.basic);
    await openBasicTrigger(page);
    const tree = panelTree(page).first();
    const root = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });

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
