import { expect, test } from '@playwright/test';

test.describe('framework smoke', () => {
  test('examples app responds and renders <app-root>', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Examples/i);
    await expect(page.locator('app-root')).toBeVisible();
  });
});
