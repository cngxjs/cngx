import { expect, test } from '../_test';

import { gotoDemo } from '../_helpers';

// The examples app shell must survive what a story does in its own scope:
// a story's isolated root is torn down on navigation without taking the app
// with it, and the floating density toggle writes through the density axis,
// so a persisted choice is what the axis and <html> show after a reload.

test.describe('examples app shell', () => {
  test('navigating away from a story with an isolated root keeps the app', async ({ page }) => {
    await gotoDemo(page, 'core/i18n/pack-providers/app-wide-german-pack');
    await expect(page.locator('cngx-paginator')).toBeVisible();

    await gotoDemo(page, 'core/theming/density/scope-a-section');

    await expect(page.locator('app-root')).toHaveCount(1);
    await expect(page.locator('.demo-scope-panel').first()).toBeVisible();
  });

  test('a persisted density survives a reload on <html>', async ({ page }) => {
    await gotoDemo(page, 'core/theming/density/scope-a-section');
    await page.evaluate(() => localStorage.setItem('cngx_density', 'compact'));

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  });

  test('the density toggle writes the axis and persists it', async ({ page }) => {
    await gotoDemo(page, 'core/theming/density/scope-a-section');
    await page.evaluate(() => localStorage.removeItem('cngx_density'));
    await page.reload();
    const toggle = page.locator('#cngx-ex-density-toggle');

    await toggle.click();

    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
    expect(await page.evaluate(() => localStorage.getItem('cngx_density'))).toBe('compact');
  });
});
