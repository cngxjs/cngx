import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/display/avatar';

test.describe('CngxAvatar demo', () => {
  test('renders size variants', async ({ page }) => {
    await page.goto(ROUTE);
    const avatars = page.locator('cngx-avatar');
    await expect(avatars.first()).toBeVisible();
    await expect(page.locator('cngx-avatar.cngx-avatar--xl').first()).toBeVisible();
  });

  test('shows initials when no image', async ({ page }) => {
    await page.goto(ROUTE);
    const first = page.locator('cngx-avatar.cngx-avatar--xs').first();
    await expect(first).toContainText('A');
  });

  test('status dot has aria-label', async ({ page }) => {
    await page.goto(ROUTE);
    const online = page.locator('cngx-avatar').filter({ hasText: 'ON' });
    const dot = online.locator('.cngx-avatar__status');
    await expect(dot).toHaveAttribute('aria-label', 'online');
  });

  test('square shape applies class', async ({ page }) => {
    await page.goto(ROUTE);
    const square = page.locator('cngx-avatar.cngx-avatar--square');
    await expect(square).toHaveCount(1);
  });
});
