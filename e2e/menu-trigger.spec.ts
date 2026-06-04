import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/menu-trigger';

test.describe('CngxMenuTrigger demo', () => {
  test('aria-haspopup=menu on trigger', async ({ page }) => {
    await page.goto(ROUTE);
    await expect(page.locator('button.trigger')).toHaveAttribute('aria-haspopup', 'menu');
  });

  test('ArrowDown opens menu and highlights first', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const openRow = page.locator('.event-row').filter({ has: page.locator('.event-label', { hasText: /^Open$/ }) });
    await expect(openRow.locator('.event-value')).toHaveText('yes');
    const menu = page.locator('[role="menu"]');
    await expect(menu).toHaveAttribute('aria-activedescendant', /.+/);
  });

  test('Enter activates and closes', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown'); // open, new
    await page.keyboard.press('ArrowDown'); // open
    await page.keyboard.press('Enter');
    const action = page.locator('.event-row', { hasText: 'Last action' });
    await expect(action.locator('.event-value')).toHaveText('open');
    const openRow = page.locator('.event-row').filter({ has: page.locator('.event-label', { hasText: /^Open$/ }) });
    await expect(openRow.locator('.event-value')).toHaveText('no');
  });

  test('Escape closes without activating', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    const openRow = page.locator('.event-row').filter({ has: page.locator('.event-label', { hasText: /^Open$/ }) });
    await expect(openRow.locator('.event-value')).toHaveText('no');
    const action = page.locator('.event-row', { hasText: 'Last action' });
    await expect(action.locator('.event-value')).toHaveText('—');
  });
});
