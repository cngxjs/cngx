import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/option';

test.describe('CngxOption demo', () => {
  test('renders options with role="option" and stable ids', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Flat options"]');
    const options = listbox.locator('[cngxOption]');
    await expect(options).toHaveCount(4);
    await expect(options.first()).toHaveAttribute('role', 'option');
    await expect(options.first()).toHaveAttribute('id', /^cngx-option-/);
  });

  test('click on enabled option highlights and activates', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Flat options"]');
    await listbox.locator('[cngxOption]').nth(1).click();
    const lastActivatedRow = page.locator('.event-row', { hasText: 'Last activated' });
    await expect(lastActivatedRow.locator('.event-value')).toHaveText('paste-special');
  });

  test('disabled option has aria-disabled and does not activate on click', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Flat options"]');
    const disabled = listbox.locator('[cngxOption]').nth(2);
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await disabled.click({ force: true });
    const lastActivatedRow = page.locator('.event-row', { hasText: 'Last activated' });
    await expect(lastActivatedRow.locator('.event-value')).toHaveText('—');
  });

  test('arrow keys skip disabled options', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Flat options"]');
    await listbox.focus();
    // Default highlight: none. ArrowDown -> paste
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute('aria-activedescendant', /cngx-option-/);
    // ArrowDown -> paste-special
    await page.keyboard.press('ArrowDown');
    // ArrowDown -> should skip disabled paste-values -> land on paste-formatting
    await page.keyboard.press('ArrowDown');
    const activeRow = page.locator('.event-row', { hasText: 'Active value' });
    await expect(activeRow.locator('.event-value')).toHaveText('paste-formatting');
  });

  test('grouped options render role="group" with aria-label', async ({ page }) => {
    await page.goto(ROUTE);
    const groupedBox = page.locator('[role="listbox"][aria-label="Grouped options"]');
    const groups = groupedBox.locator('[role="group"]');
    await expect(groups).toHaveCount(2);
    await expect(groups.first()).toHaveAttribute('aria-label', 'Fruits');
    await expect(groups.nth(1)).toHaveAttribute('aria-label', 'Vegetables');
  });
});
