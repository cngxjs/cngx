import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/a11y/active-descendant';

test.describe('CngxActiveDescendant demo', () => {
  test('renders the listbox section with aria attributes', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Fruits"]');
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute('aria-activedescendant', /fruit-apple/);
    await expect(listbox.locator('[role="option"]')).toHaveCount(6);
  });

  test('ArrowDown moves the active descendant', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Fruits"]');
    await listbox.focus();
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute('aria-activedescendant', 'fruit-banana');
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute('aria-activedescendant', 'fruit-cherry');
  });

  test('ArrowDown skips disabled items', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Fruits"]');
    await listbox.focus();
    // Apple -> Banana -> Cherry -> (Date disabled) -> Elderberry
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute('aria-activedescendant', 'fruit-elder');
  });

  test('End jumps to last, Home to first', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Fruits"]');
    await listbox.focus();
    await page.keyboard.press('End');
    await expect(listbox).toHaveAttribute('aria-activedescendant', 'fruit-fig');
    await page.keyboard.press('Home');
    await expect(listbox).toHaveAttribute('aria-activedescendant', 'fruit-apple');
  });

  test('Enter activates the current item', async ({ page }) => {
    await page.goto(ROUTE);
    const listbox = page.locator('[role="listbox"][aria-label="Fruits"]');
    await listbox.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const lastActivatedRow = page.locator('.event-row', { hasText: 'Last activated' });
    await expect(lastActivatedRow.locator('.event-value')).toHaveText('banana');
  });

  test('typeahead jumps to matching label', async ({ page }) => {
    await page.goto(ROUTE);
    const typeaheadBox = page.locator('[role="listbox"][aria-label="Fruit typeahead"]');
    await typeaheadBox.focus();
    await page.keyboard.type('e');
    await expect(typeaheadBox).toHaveAttribute('aria-activedescendant', 'fruit-elder-ta');
  });
});
