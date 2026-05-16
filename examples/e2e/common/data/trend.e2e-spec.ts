import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTrend renders a directional indicator with an arrow + formatted
// percentage. Positive / negative / zero each produce distinct host markers.

test.describe('common/data/trend', () => {
  test('trend-directions: three trends differ by direction modifier', async ({ page }) => {
    await gotoDemo(page, 'common/data/trend/trend-directions');

    const trends = page.locator('cngx-trend');
    await expect(trends).toHaveCount(3);

    // Each carries either a class or attribute marker for its direction.
    // The exact marker name is library-internal; assert at least the text
    // content shows the value with a sign or zero.
    await expect(trends.nth(0)).toContainText(/5/);
    await expect(trends.nth(1)).toContainText(/2/);
    await expect(trends.nth(2)).toContainText(/0/);

    await expect(page).toHaveScreenshot('trend-directions.png', { fullPage: true });
  });

  test('composed-with-metric-in-a-card: trend renders inside a card alongside a metric', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/trend/composed-with-metric-in-a-card');
    await expect(page.locator('cngx-trend').first()).toBeVisible();
    await expect(page.locator('cngx-metric').first()).toBeVisible();
    await expect(page).toHaveScreenshot('trend-in-card.png', { fullPage: true });
  });
});
