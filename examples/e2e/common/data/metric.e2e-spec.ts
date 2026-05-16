import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMetric renders a locale-formatted number with optional unit.
// Null values render em-dash; string passthrough is supported.

test.describe('common/data/metric', () => {
  test('standalone-metrics: 5 metric variants render the right text', async ({ page }) => {
    await gotoDemo(page, 'common/data/metric/standalone-metrics');

    const metrics = page.locator('cngx-metric');
    await expect(metrics).toHaveCount(5);

    // Locale-formatted "1,234" / "1.234" depending on locale — match digits.
    await expect(metrics.nth(0)).toContainText(/1[.,]?234/);
    await expect(metrics.nth(1)).toContainText('75');
    await expect(metrics.nth(1)).toContainText('bpm');
    await expect(metrics.nth(2)).toContainText(/99\.6/);
    await expect(metrics.nth(2)).toContainText('%');
    // Null renders em-dash.
    await expect(metrics.nth(3)).toContainText(/—|–|-/);
    await expect(metrics.nth(4)).toContainText('n.b.');

  });

  test('inside-a-card: metric composed inside a card renders', async ({ page }) => {
    await gotoDemo(page, 'common/data/metric/inside-a-card');
    await expect(page.locator('cngx-metric').first()).toBeVisible();
  });
});
