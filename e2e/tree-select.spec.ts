import { expect, test, type Locator, type Page } from '@playwright/test';

const R = {
  basic: '/#/forms/select/tree-select/basic-single-level-toggle',
  cascade: '/#/forms/select/tree-select/cascade-children-parent-toggle-selects-the-whole-subtree',
  custom: '/#/forms/select/tree-select/custom-cngxtreeselectnode-template',
  typeToFind: '/#/forms/select/tree-select/type-to-find-expand-to-reveal',
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

  test('click opens the panel with a role="tree" container', async ({ page }) => {
    await page.goto(R.basic);
    await openBasicTrigger(page);
    const tree = panelTree(page).first();
    await expect(tree).toBeVisible();
    // aria-multiselectable belongs to the aria-selected model; the tree
    // communicates multi-ness via per-row aria-checked instead.
    await expect(tree).not.toHaveAttribute('aria-multiselectable', /.+/);
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
    // is on in this section; clicking the parent checks all four rows
    // (parent + three children) in one toggle, and the trigger summarizes the
    // fully selected subtree as one parent chip (chipDisplay 'parents').
    const frontend = section.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });
    await frontend.click();
    await expect(frontend).toHaveAttribute('aria-checked', 'true');
    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(1);
    await expect(chips.first()).toContainText('Frontend');
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

  test('a parent chip removes its subtree', async ({ page }) => {
    await page.goto(R.cascade);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    const frontend = section.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });
    await frontend.click();
    // Close the panel so chip × is reachable without overlay capture.
    await page.keyboard.press('Escape');

    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(1);
    // The summarizing chip stands for the whole subtree: removing it
    // deselects the parent and every descendant.
    await chips.first().locator('.cngx-chip__remove').click();
    await expect(chips).toHaveCount(0);
    await trigger.click();
    await expect(frontend).toHaveAttribute('aria-checked', 'false');
  });

  test('a child chip removes one value', async ({ page }) => {
    await page.goto(R.basic);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    await section.locator('[role="treeitem"]').filter({ hasText: 'Angular' }).click();
    await section.locator('[role="treeitem"]').filter({ hasText: 'Signals' }).click();
    await page.keyboard.press('Escape');

    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(2);
    await chips.first().locator('.cngx-chip__remove').click();
    await expect(chips).toHaveCount(1);
  });

  test('keyboard: Enter and Space on a chip remove button remove the chip', async ({ page }) => {
    // Non-cascade route: one chip per value, so each key removes one chip.
    await page.goto(R.basic);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    for (const name of ['Angular', 'Signals', 'RxJS']) {
      await section.locator('[role="treeitem"]').filter({ hasText: name }).click();
    }
    await page.keyboard.press('Escape');

    const chips = section.locator('cngx-chip');
    await expect(chips).toHaveCount(3);

    await chips.first().locator('.cngx-chip__remove').focus();
    await page.keyboard.press('Enter');
    await expect(chips).toHaveCount(2);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await chips.first().locator('.cngx-chip__remove').focus();
    await page.keyboard.press('Space');
    await expect(chips).toHaveCount(1);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
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

  test('ARIA treeitem fields are reactive: expanded/checked/level/posinset/setsize', async ({ page }) => {
    await page.goto(R.basic);
    await openBasicTrigger(page);
    const tree = panelTree(page).first();
    const root = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });

    // initiallyExpanded='all' → root is expanded, aria-checked=false.
    await expect(root).toHaveAttribute('aria-expanded', 'true');
    await expect(root).toHaveAttribute('aria-checked', 'false');
    await expect(root).toHaveAttribute('aria-level', '1');
    await expect(root).toHaveAttribute('aria-posinset', '1');
    await expect(root).not.toHaveAttribute('aria-selected', /.+/);

    // Click root → aria-checked flips to true (cascade is off in this section,
    // so only the root itself toggles).
    await root.click();
    await expect(root).toHaveAttribute('aria-checked', 'true');
  });

  test('expandToReveal: typing a hidden-only match expands its ancestor and highlights it', async ({ page }) => {
    await page.goto(R.typeToFind);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();
    const tree = panelTree(page).first();
    await expect(tree).toBeVisible();

    // All branches start collapsed; 'p' only matches Postgres under Backend.
    const backend = tree.locator('[role="treeitem"]').filter({ hasText: 'Backend' });
    await expect(backend).toHaveAttribute('aria-expanded', 'false');
    await tree.press('p');
    await expect(backend).toHaveAttribute('aria-expanded', 'true');
    await expect(tree).toHaveAttribute('aria-activedescendant', /-postgres$/);
  });

  test('expandToReveal off: a hidden-only match is a no-op', async ({ page }) => {
    await page.goto(R.typeToFind);
    const section = ex(page);
    // Chrome toggle switches [expandToReveal] off before opening.
    await section.getByRole('checkbox').uncheck();
    const trigger = triggerOf(section);
    await trigger.click();
    const tree = panelTree(page).first();
    await expect(tree).toBeVisible();

    const backend = tree.locator('[role="treeitem"]').filter({ hasText: 'Backend' });
    await tree.press('p');
    // The highlight stays where autoHighlightFirst put it and nothing expands.
    await expect(backend).toHaveAttribute('aria-expanded', 'false');
    await expect(tree).toHaveAttribute('aria-activedescendant', /-frontend$/);
  });

  test('partial cascade selection surfaces aria-checked="mixed" on the parent', async ({ page }) => {
    await page.goto(R.cascade);
    const section = ex(page);
    const trigger = triggerOf(section);
    await trigger.click();

    // Select ONE leaf under "Frontend" → the parent is partially selected:
    // indeterminate indicator + aria-checked="mixed" from the same computed
    // selection source.
    const leaf = section.locator('[role="treeitem"]').filter({ hasText: 'Angular' });
    await leaf.click();
    const frontend = section.locator('[role="treeitem"]').filter({ hasText: 'Frontend' });
    await expect(frontend).toHaveAttribute('aria-checked', 'mixed');
    await expect(leaf).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('CngxTreeSelect on a phone (touch floor)', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test.skip(({ browserName }) => browserName === 'firefox', 'Firefox has no isMobile emulation');

  async function openSheet(page: Page): Promise<Locator> {
    await page.goto(R.cascade);
    const trigger = triggerOf(ex(page));
    await trigger.tap();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    return panelTree(page).first();
  }

  test('a row tap on a parent expands it and does not select', async ({ page }) => {
    const tree = await openSheet(page);
    const frontend = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' }).first();
    const before = await frontend.getAttribute('aria-expanded');
    await frontend.locator('.cngx-tree-select__label').tap();
    await expect(frontend).toHaveAttribute('aria-expanded', before === 'true' ? 'false' : 'true');
    await expect(frontend).toHaveAttribute('aria-checked', 'false');
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('.cngx-select__panel')),
    ).toBe(true);
  });

  test('a tap on the checkbox selects the parent', async ({ page }) => {
    const tree = await openSheet(page);
    const frontend = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' }).first();
    const before = await frontend.getAttribute('aria-expanded');
    await frontend.locator('.cngx-tree-select__check').tap();
    await expect(frontend).toHaveAttribute('aria-checked', 'true');
    await expect(frontend).toHaveAttribute('aria-expanded', before ?? 'false');
  });

  test('an AT-style activation of a parent treeitem selects it', async ({ page }) => {
    const tree = await openSheet(page);
    const frontend = tree.locator('[role="treeitem"]').filter({ hasText: 'Frontend' }).first();
    // VoiceOver / TalkBack activate the focused node with a simulated click
    // and no pointer events.
    await frontend.dispatchEvent('click');
    await expect(frontend).toHaveAttribute('aria-checked', 'true');
  });
});
