import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/listbox-trigger';

test.describe('CngxListboxTrigger demo', () => {
  test('aria-haspopup=listbox on trigger', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  test('ArrowDown opens popover and highlights first', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const openRow = page.locator('.event-row', { hasText: 'Open' });
    await expect(openRow.locator('.event-value')).toHaveText('yes');
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toHaveAttribute('aria-activedescendant', /.+/);
  });

  test('Enter selects and closes', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const selRow = page.locator('.event-row', { hasText: 'Selected' });
    await expect(selRow.locator('.event-value')).toHaveText('green');
    const openRow = page.locator('.event-row', { hasText: 'Open' });
    await expect(openRow.locator('.event-value')).toHaveText('no');
  });

  test('Escape closes and restores button label unchanged', async ({ page }) => {
    await page.goto(ROUTE);
    const trigger = page.locator('button.trigger');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    const openRow = page.locator('.event-row', { hasText: 'Open' });
    await expect(openRow.locator('.event-value')).toHaveText('no');
  });
});
