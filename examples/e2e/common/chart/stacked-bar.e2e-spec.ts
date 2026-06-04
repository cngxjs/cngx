import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStackedBar renders a single horizontal bar composed of
// labelled segments. Pure DOM (no SVG). ARIA enumerates the segments.

test.describe('common/chart/stacked-bar', () => {
  test('proportional-share-strips: each bar paints one segment per input row', async ({ page }) => {
    await gotoDemo(page, 'common/chart/stacked-bar/proportional-share-strips');

    const bars = page.locator('cngx-stacked-bar');
    await expect(bars).toHaveCount(2);

    // First bar has 4 segments (Documents/Photos/Apps/System).
    const segments1 = bars.nth(0).locator('.cngx-stacked-bar__segment');
    await expect(segments1).toHaveCount(4);
    // Second bar also has 4 segments (Chrome/Safari/Firefox/Other).
    const segments2 = bars.nth(1).locator('.cngx-stacked-bar__segment');
    await expect(segments2).toHaveCount(4);

    // Widths reflect the relative shares — Chrome (65) > Safari (18).
    const widths = await segments2.evaluateAll((els) =>
      els.map((el) => parseFloat((el as HTMLElement).style.width || '0')),
    );
    expect(widths[0]).toBeGreaterThan(widths[1]);
    expect(widths[0]).toBeGreaterThan(widths[2]);

  });

  test('async-state-machine: status follows the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/stacked-bar/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    // After success: at least one segment exists.
    await expect(page.locator('cngx-stacked-bar .cngx-stacked-bar__segment').first()).toBeVisible();

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });
});
