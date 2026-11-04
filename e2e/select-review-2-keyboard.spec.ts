import { expect, test, type Locator, type Page } from '@playwright/test';

// Routes for the 2026-11-03 independent-review keyboard, sheet and Tab
// findings (I1, I2, I4, I6, I10). Red cases are test.fail - the Phase 2-5
// fixes flip them.
const ROUTES = {
  select: '/#/forms/select/single-select/standalone',
  multi: '/#/forms/select/multi-select/multi-clearable',
  combobox: '/#/forms/select/combobox/combobox-basic-tag-picker-with-typeahead-filter',
  typeahead: '/#/forms/select/typeahead/typeahead-single-value-async-autocomplete',
  actionSelect: '/#/forms/select/action-select/basic-sync-quick-create',
  actionMulti: '/#/forms/select/action-multi-select/basic',
  reorder: '/#/forms/select/reorderable-multi-select/commit-action-optimistic-pessimistic-with-supersede',
  tree: '/#/forms/select/tree-select/basic-single-level-toggle',
  shell: '/#/forms/select/select-shell/basic-flat-declarative-options',
  shellSearch: '/#/forms/select/select-shell/search-declarative-cngx-select-search',
  allVariants: '/#/forms/select/mobile-sheet/all-variants',
} as const;

function combobox(page: Page): Locator {
  return page.locator('.cngx-ex-artifact [role="combobox"]').first();
}

function panel(page: Page): Locator {
  return page.locator('.cngx-ex-artifact [role="listbox"], .cngx-ex-artifact [role="tree"]').first();
}

async function openByClick(page: Page): Promise<Locator> {
  // Button-led hosts expose .cngx-field-trigger; input-led hosts (combobox,
  // action-multi) open from the role=combobox input instead.
  const opener = page
    .locator('.cngx-ex-artifact .cngx-field-trigger, .cngx-ex-artifact [role="combobox"]')
    .first();
  await expect(opener).toBeVisible();
  await opener.click();
  await expect(panel(page)).toBeVisible();
  return opener;
}

// ── I10: Alt+ArrowDown opens the panel on every host. ────────────────────────
test.describe('I10: Alt+ArrowDown opens every select host', () => {
  for (const [key, route] of Object.entries(ROUTES).filter(([k]) => k !== 'allVariants' && k !== 'shellSearch')) {
    test(`${key}: Alt+ArrowDown opens the panel`, async ({ page }) => {
      test.fail();
      await page.goto(route);
      const trigger = page.locator('.cngx-ex-artifact .cngx-field-trigger, .cngx-ex-artifact [role="combobox"]').first();
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await page.keyboard.press('Alt+ArrowDown');
      await expect(panel(page)).toBeVisible({ timeout: 1000 });
    });
  }
});

// ── I1: Escape inside the open debounce leaves the panel closed. ─────────────
test.describe('I1: Escape during the search debounce leaves the panel closed', () => {
  for (const key of ['typeahead', 'combobox'] as const) {
    test(`${key}: Escape in the debounce window keeps the panel closed`, async ({ page }) => {
      test.fail();
      await page.goto(ROUTES[key]);
      const input = page.locator('.cngx-ex-artifact input').first();
      await expect(input).toBeVisible();
      await input.focus();
      await input.pressSequentially('gr', { delay: 20 });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      await expect(panel(page)).toBeHidden();
    });
  }
});

// ── I6: Tab from the open trigger onto a chip remove or clear button leaves
// aria-expanded="false". ─────────────────────────────────────────────────────
test.describe('I6: Tab onto an in-host control collapses aria-expanded', () => {
  // Shell already collapses aria-expanded on Tab; multi, reorderable, tree
  // and action-multi do not.
  const I6_GREEN = new Set(['shell']);
  for (const key of ['multi', 'reorder', 'tree', 'shell', 'actionMulti'] as const) {
    test(`${key}: Tab to the next control sets aria-expanded false`, async ({ page }) => {
      if (!I6_GREEN.has(key)) {
        test.fail();
      }
      await page.goto(ROUTES[key]);
      await openByClick(page);
      await page.keyboard.press('Tab');
      await expect(combobox(page)).toHaveAttribute('aria-expanded', 'false');
    });
  }
});

// ── I2: in auto presentation the sheet opens at 390px, flips to an anchored
// panel at 1024px and back to a sheet at 390px. The flip back must re-home
// focus inside the sheet; today it does not. ─────────────────────────────────
const I2_OPENERS = {
  'cngx-combobox': 'cngx-combobox input',
  'cngx-action-select': 'cngx-action-select input[role="combobox"]',
} as const;
test.describe('I2: a sheet keeps focus inside across a presentation round trip', () => {
  for (const [variant, opener] of Object.entries(I2_OPENERS)) {
    test(`${variant}: focus stays in the sheet across a resize`, async ({ page }) => {
      test.fail();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(ROUTES.allVariants);
      await page.locator(opener).first().click();
      const sheet = page.locator('.cngx-popover-sheet:not([aria-hidden="true"])').first();
      await expect(sheet).toBeVisible({ timeout: 3000 });
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(150);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(250);
      const open = page.locator('.cngx-popover-sheet:not([aria-hidden="true"])').first();
      await expect(open).toBeVisible();
      const inSheet = await open.evaluate((el) => el.contains(document.activeElement));
      expect(inSheet).toBe(true);
    });
  }
});

// ── C1 / I4: the shell search input carries aria-activedescendant and it moves
// with ArrowDown. ────────────────────────────────────────────────────────────
test.describe('C1/I4: the shell search input moves aria-activedescendant', () => {
  test('ArrowDown on the focused search input updates aria-activedescendant', async ({ page }) => {
    test.fail();
    await page.goto(ROUTES.shellSearch);
    await openByClick(page);
    const search = page.locator('.cngx-ex-artifact input').first();
    await expect(search).toBeVisible();
    await search.focus();
    await page.keyboard.press('ArrowDown');
    const first = await search.getAttribute('aria-activedescendant');
    expect(first).toBeTruthy();
    await page.keyboard.press('ArrowDown');
    await expect(search).not.toHaveAttribute('aria-activedescendant', first ?? '');
  });
});
