import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/menu';

test.describe('CngxMenu demo', () => {
  test('renders role="menu" and menuitem children', async ({ page }) => {
    await page.goto(ROUTE);
    const menu = page.locator('[role="menu"]');
    await expect(menu).toHaveAttribute('aria-label', 'File actions');
    const items = menu.locator('[role="menuitem"]');
    await expect(items).toHaveCount(5);
  });

  test('ArrowDown moves through items and skips disabled', async ({ page }) => {
    await page.goto(ROUTE);
    const menu = page.locator('[role="menu"]');
    await menu.focus();
    await page.keyboard.press('ArrowDown'); // new
    await page.keyboard.press('ArrowDown'); // open
    await page.keyboard.press('ArrowDown'); // save
    await page.keyboard.press('ArrowDown'); // skips disabled save-as -> close
    await page.keyboard.press('Enter');
    const row = page.locator('.event-row', { hasText: 'Last action' });
    await expect(row.locator('.event-value')).toHaveText('close');
  });

  test('click on item activates', async ({ page }) => {
    await page.goto(ROUTE);
    const menu = page.locator('[role="menu"]');
    await menu.locator('[role="menuitem"]').nth(1).click();
    const row = page.locator('.event-row', { hasText: 'Last action' });
    await expect(row.locator('.event-value')).toHaveText('open');
  });

  test('disabled item has aria-disabled', async ({ page }) => {
    await page.goto(ROUTE);
    const menu = page.locator('[role="menu"]');
    const disabled = menu.locator('[role="menuitem"]').nth(3);
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  });
});
