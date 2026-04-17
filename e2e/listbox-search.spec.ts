import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/listbox-search';

test.describe('CngxListboxSearch demo', () => {
  test('all commands shown when search is empty', async ({ page }) => {
    await page.goto(ROUTE);
    const options = page.locator('[role="listbox"] [cngxOption]');
    await expect(options).toHaveCount(6);
  });

  test('typing filters the list', async ({ page }) => {
    await page.goto(ROUTE);
    const search = page.locator('input[cngxListboxSearch]');
    await search.fill('save');
    const options = page.locator('[role="listbox"] [cngxOption]');
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toContainText('Save');
  });

  test('empty state when nothing matches', async ({ page }) => {
    await page.goto(ROUTE);
    const search = page.locator('input[cngxListboxSearch]');
    await search.fill('zzz');
    const empty = page.locator('.empty');
    await expect(empty).toHaveText('No matching commands.');
  });

  test('keyboard selection works after filtering', async ({ page }) => {
    await page.goto(ROUTE);
    const search = page.locator('input[cngxListboxSearch]');
    await search.fill('save');
    // Wait for the search debounce to apply and DOM to filter.
    await expect(page.locator('[role="listbox"] [cngxOption]')).toHaveCount(2);
    const listbox = page.locator('[role="listbox"]');
    await listbox.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const row = page.locator('.event-row', { hasText: 'Last selected' });
    await expect(row.locator('.event-value')).toHaveText('save');
  });
});
