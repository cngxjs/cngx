import { expect, test, type Locator, type Page } from '@playwright/test';

async function nextFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

/**
 * Counts `focusout` events on the select host whose next focus target lies
 * outside it - the moments the field-facing rule reads as leaving the field.
 */
async function countHostLeaves(host: Locator): Promise<() => Promise<number>> {
  await host.evaluate((el) => {
    const target = el as HTMLElement & { __leaves?: number };
    target.__leaves = 0;
    el.addEventListener('focusout', (event) => {
      const next = (event as FocusEvent).relatedTarget;
      if (!(next instanceof Node && el.contains(next))) {
        target.__leaves = (target.__leaves ?? 0) + 1;
      }
    });
  });
  return () => host.evaluate((el) => (el as HTMLElement & { __leaves?: number }).__leaves ?? 0);
}

function eventValue(page: Page, label: string): Locator {
  return page
    .locator('.event-row')
    .filter({ has: page.locator('.event-label', { hasText: label }) })
    .locator('.event-value');
}

test.describe('select focus stays inside the control', () => {
  test('CngxSelectShell: search input click, then a mouse pick keeps focus inside', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/select-shell/search-declarative-cngx-select-search');
    const host = page.locator('cngx-select-shell').first();
    const owner = host.locator('[role="combobox"]').first();
    const search = host.locator('.cngx-select-search__input');
    const options = host.locator('[role="option"]:not([aria-disabled="true"])');

    await owner.click();
    await expect(search).toBeVisible();
    const leaves = await countHostLeaves(host);
    await search.click();
    await expect(search).toBeFocused();
    const picked = (await options.nth(1).textContent())?.trim() ?? '';
    await options.nth(1).click();

    await expect(eventValue(page, 'value')).toHaveText(picked);
    await expect(owner).toBeFocused();
    expect(await leaves()).toBe(0);
  });

  test('CngxActionSelect: the action button commits without focus leaving the host', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/action-select/basic-sync-quick-create');
    const host = page.locator('cngx-action-select').first();
    const owner = host.locator('input[role="combobox"]').first();
    const action = host.locator('.action-slot-btn');

    await owner.click();
    await owner.fill('Security');
    await expect(action).toBeEnabled();
    const leaves = await countHostLeaves(host);
    await action.click();

    await expect(eventValue(page, 'Selected')).toHaveText('Security');
    await expect(owner).toBeFocused();
    expect(await leaves()).toBe(0);
  });

  test('CngxTreeSelect: a twisty click keeps focus on the tree, ArrowDown still moves', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/tree-select/basic-single-level-toggle');
    const host = page.locator('cngx-tree-select').first();
    const owner = host.locator('[role="combobox"]').first();
    const tree = host.locator('[role="tree"]');

    await owner.click();
    await expect(tree).toBeFocused();
    const leaves = await countHostLeaves(host);
    const twisty = host.locator('.cngx-tree-select__twisty').first();
    const expanded = await twisty.evaluate((el) =>
      el.closest('[role="treeitem"]')!.getAttribute('aria-expanded'),
    );
    await twisty.click();
    await expect(twisty.locator('xpath=ancestor::*[@role="treeitem"][1]')).not.toHaveAttribute(
      'aria-expanded',
      expanded ?? '',
    );
    await expect(tree).toBeFocused();

    const before = await tree.getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    await expect(tree).not.toHaveAttribute('aria-activedescendant', before ?? '');

    await page.keyboard.press('Escape');
    await expect(tree).toBeHidden();
    await expect(owner).toBeFocused();
    expect(await leaves()).toBe(0);
  });

  test('CngxMultiSelect: a chip x click moves focus to the trigger, not to body', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/multi-select/multi-clearable');
    const host = page.locator('cngx-multi-select').first();
    const owner = host.locator('[role="combobox"]').first();
    await expect(eventValue(page, 'Values')).toHaveText('angular');

    await owner.focus();
    const leaves = await countHostLeaves(host);
    await host.locator('.cngx-chip__remove').first().click();

    await expect(eventValue(page, 'Values')).toHaveText('—');
    await expect(owner).toBeFocused();
    expect(await leaves()).toBe(0);
  });

  test('CngxMultiSelect: clear-all moves focus to the trigger, not to body', async ({ page }) => {
    await page.goto('/#/forms/select/multi-select/multi-clearable');
    const host = page.locator('cngx-multi-select').first();
    const owner = host.locator('[role="combobox"]').first();
    await expect(eventValue(page, 'Values')).toHaveText('angular');

    await owner.focus();
    const leaves = await countHostLeaves(host);
    await host.locator('.cngx-multi-select__clear-all').click();

    await expect(eventValue(page, 'Values')).toHaveText('—');
    await expect(owner).toBeFocused();
    expect(await leaves()).toBe(0);
  });

  test('CngxSelect in a required field: leaving it marks touched and shows the error', async ({
    page,
  }) => {
    await page.goto('/#/forms/select/single-select/signal-forms-required');
    const field = page.locator('cngx-form-field').first();
    const owner = field.locator('[role="combobox"]').first();

    await owner.focus();
    await expect(field).toHaveClass(/cngx-field--focused/);
    await expect(field).not.toHaveClass(/cngx-field--touched/);
    await nextFrame(page);
    await owner.press('Tab');

    await expect(field).toHaveClass(/cngx-field--touched/);
    await expect(field).not.toHaveClass(/cngx-field--focused/);
    await expect(field).toHaveClass(/cngx-field--error/);
  });
});
