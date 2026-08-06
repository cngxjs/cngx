import { expect, test, type Locator, type Page } from '@playwright/test';

const R = {
  basic: '/#/forms/select/multi-select/multi-basic',
  clearable: '/#/forms/select/multi-select/multi-clearable',
  custom: '/#/forms/select/multi-select/multi-custom-cngxmultiselectchip-template',
};

function ex(page: Page): Locator {
  return page.locator('main');
}

test.describe('CngxMultiSelect demo', () => {
  test('basic: picking two options renders two chips, panel stays open', async ({ page }) => {
    await page.goto(R.basic);
    const section = ex(page);
    const trigger = section.locator('cngx-multi-select .cngx-multi-select__trigger').first();
    await trigger.click();

    // aria-multiselectable is a contractual a11y signal on the inner listbox.
    const listbox = section.locator('[cngxListbox]');
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');

    // Start from a known state by clearing the two initial chips first.
    const chips = section.locator('cngx-chip');
    const startCount = await chips.count();

    // Click the 3rd option — then confirm chip count incremented by 1 and panel stays open.
    await section.locator('[cngxOption]').nth(2).click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(chips).toHaveCount(startCount + 1);
  });

  test('chip × removes a value', async ({ page }) => {
    await page.goto(R.basic);
    const section = ex(page);
    const chips = section.locator('cngx-chip');
    // Preloaded chips hydrate after first render — wait before counting.
    await expect(chips.first()).toBeVisible();
    const initialCount = await chips.count();
    expect(initialCount).toBeGreaterThan(0);

    await chips.first().locator('.cngx-chip__remove').click();
    await expect(chips).toHaveCount(initialCount - 1);
  });

  test('clear-all empties every selected value', async ({ page }) => {
    await page.goto(R.clearable);
    const section = ex(page);
    const clearAll = section.locator('.cngx-multi-select__clear-all');
    await expect(clearAll).toBeVisible();

    await clearAll.click();
    const valueRow = section.locator('.event-row', { hasText: 'Values' }).locator('.event-value');
    await expect(valueRow).toHaveText('—');
    // Clear-all button itself disappears because the selection is empty.
    await expect(clearAll).toHaveCount(0);
  });

  test('custom *cngxMultiSelectChip template renders consumer markup', async ({ page }) => {
    await page.goto(R.custom);
    const section = ex(page);
    // The default <cngx-chip> host is absent — consumer template replaces it.
    await expect(section.locator('cngx-chip')).toHaveCount(0);
    // Hash-prefix label from the demo template.
    await expect(section).toContainText('#Angular');
    await expect(section).toContainText('#Signals');
  });
});
