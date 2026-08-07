import { expect, test } from '@playwright/test';

test.describe('CngxDivider demo', () => {
  test('renders role="separator" and aria-orientation', async ({ page }) => {
    await page.goto('/#/common/display/divider/horizontal-vs-vertical');
    const artifact = page.locator('.cngx-ex-artifact');
    const horizontals = artifact.locator('cngx-divider[aria-orientation="horizontal"]');
    const verticals = artifact.locator('cngx-divider[aria-orientation="vertical"]');
    await expect(horizontals.first()).toHaveAttribute('role', 'separator');
    await expect(verticals.first()).toHaveAttribute('role', 'separator');
  });

  test('inset modifier applies class', async ({ page }) => {
    await page.goto('/#/common/display/divider/inset');
    const inset = page.locator('.cngx-ex-artifact cngx-divider.cngx-divider--inset');
    await expect(inset).toHaveCount(1);
  });
});
