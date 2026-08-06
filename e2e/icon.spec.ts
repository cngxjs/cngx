import { expect, test } from '@playwright/test';

test.describe('CngxIcon demo', () => {
  test('renders size variants with proper classes', async ({ page }) => {
    await page.goto('/#/common/display/icon/sizes');
    const icons = page.locator('.cngx-ex-artifact cngx-icon');
    await expect(icons).toHaveCount(5);
    await expect(icons.nth(0)).toHaveClass(/cngx-icon--xs/);
    await expect(icons.nth(2)).toHaveClass(/cngx-icon--md/);
    await expect(icons.nth(4)).toHaveClass(/cngx-icon--xl/);
  });

  test('decorative icon has aria-hidden, no role', async ({ page }) => {
    await page.goto('/#/common/display/icon/decorative-vs-informative');
    const decorative = page.locator('.cngx-ex-artifact cngx-icon').nth(0);
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role', /.*/);
  });

  test('labeled icon gets role="img" and aria-label', async ({ page }) => {
    await page.goto('/#/common/display/icon/decorative-vs-informative');
    const labeled = page.locator('cngx-icon[aria-label="Saved"]');
    await expect(labeled).toHaveAttribute('role', 'img');
    await expect(labeled).toHaveAttribute('aria-label', 'Saved');
  });
});
