import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSparkline composes <cngx-chart> + <cngx-line> (+ optional
// area). The host renders as role="img" via the chart wrapper; the data
// table mirrors the values for AT.

test.describe('common/chart/sparkline', () => {
  test('basic-sparklines: three sparklines with distinct data series', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/basic-sparklines');

    const sparklines = page.locator('cngx-sparkline');
    await expect(sparklines).toHaveCount(3);

    // Each sparkline composes a chart with a line path.
    for (let i = 0; i < 3; i++) {
      const s = sparklines.nth(i);
      await expect(s.locator('svg path.cngx-line')).toHaveCount(1);
    }

    await expect(page).toHaveScreenshot('basic-sparklines.png', { fullPage: true });
  });

  test('with-area-fill: line + filled area both render', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/with-area-fill');

    const sparkline = page.locator('cngx-sparkline').first();
    await expect(sparkline.locator('svg path.cngx-line')).toHaveCount(1);
    await expect(sparkline.locator('svg path.cngx-area')).toHaveCount(1);

    await expect(page).toHaveScreenshot('with-area-fill.png', { fullPage: true });
  });

  test('async-state-machine: status follows the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    await expect(page.locator('cngx-sparkline svg path.cngx-line')).toHaveCount(1);

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

    await expect(page).toHaveScreenshot('sparkline-error.png', { fullPage: true });
  });
});
