import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/listbox';

test.describe('CngxListbox demo', () => {
  test('renders role="listbox" and aria-label', async ({ page }) => {
    await page.goto(ROUTE);
    const single = page.locator('[role="listbox"][aria-label="Fruits (single)"]');
    const multi = page.locator('[role="listbox"][aria-label="Fruits (multi)"]');
    await expect(single).toBeVisible();
    await expect(multi).toBeVisible();
    await expect(multi).toHaveAttribute('aria-multiselectable', 'true');
  });

  test('single-select: clicking an option sets selection + label', async ({ page }) => {
    await page.goto(ROUTE);
    const single = page.locator('[role="listbox"][aria-label="Fruits (single)"]');
    await single.locator('[cngxOption]').nth(1).click();
    const rows = page.locator('.event-row').first().locator('..').locator('.event-row');
    await expect(rows.first().locator('.event-value')).toHaveText('banana');
  });

  test('single-select: ArrowDown + Enter selects', async ({ page }) => {
    await page.goto(ROUTE);
    const single = page.locator('[role="listbox"][aria-label="Fruits (single)"]');
    await single.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const selectedRow = page.locator('.event-row', { hasText: 'Selected' }).first();
    await expect(selectedRow.locator('.event-value')).toHaveText('apple');
  });

  test('multi-select: toggling two options selects both', async ({ page }) => {
    await page.goto(ROUTE);
    const multi = page.locator('[role="listbox"][aria-label="Fruits (multi)"]');
    await multi.locator('[cngxOption]').nth(0).click();
    await multi.locator('[cngxOption]').nth(2).click();
    // The Selection row is the first event-row after the multi listbox section.
    const selectionRow = multi.locator('..').locator('.event-row', { hasText: 'Selection' });
    await expect(selectionRow.locator('.event-value')).toHaveText('apple, cherry');
  });

  test('multi-select: Select all flips isAllSelected', async ({ page }) => {
    await page.goto(ROUTE);
    const multi = page.locator('[role="listbox"][aria-label="Fruits (multi)"]');
    const parent = multi.locator('..');
    await parent.locator('button', { hasText: 'Select all' }).click();
    const allRow = parent.locator('.event-row', { hasText: 'All selected' });
    await expect(allRow.locator('.event-value')).toHaveText('yes');
  });

  test('option host gets aria-selected when selected', async ({ page }) => {
    await page.goto(ROUTE);
    const single = page.locator('[role="listbox"][aria-label="Fruits (single)"]');
    const banana = single.locator('[cngxOption]').nth(1);
    await banana.click();
    await expect(banana).toHaveAttribute('aria-selected', 'true');
  });

  test('disabled option does not fire selection', async ({ page }) => {
    await page.goto(ROUTE);
    const single = page.locator('[role="listbox"][aria-label="Fruits (single)"]');
    const cherry = single.locator('[cngxOption]').nth(2);
    await expect(cherry).toHaveAttribute('aria-disabled', 'true');
    await cherry.click({ force: true });
    const selectedRow = page.locator('.event-row', { hasText: 'Selected' }).first();
    await expect(selectedRow.locator('.event-value')).toHaveText('—');
  });
});
