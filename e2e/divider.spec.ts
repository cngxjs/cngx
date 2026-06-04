import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/display/divider';

test.describe('CngxDivider demo', () => {
  test('renders role="separator" and aria-orientation', async ({ page }) => {
    await page.goto(ROUTE);
    const horizontals = page.locator('cngx-divider[aria-orientation="horizontal"]');
    const verticals = page.locator('cngx-divider[aria-orientation="vertical"]');
    await expect(horizontals.first()).toHaveAttribute('role', 'separator');
    await expect(verticals.first()).toHaveAttribute('role', 'separator');
  });

  test('inset modifier applies class', async ({ page }) => {
    await page.goto(ROUTE);
    const inset = page.locator('cngx-divider.cngx-divider--inset');
    await expect(inset).toHaveCount(1);
  });
});
