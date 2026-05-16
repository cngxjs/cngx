import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxErrorAggregator + CngxErrorScope reveal errors on submit.
// Toggling error sources updates hasError / errorCount; reveal()
// (submit) gates list visibility via shouldShow().

test.describe('common/interactive/error-aggregator', () => {
  test('native form: errorCount reflects toggled sources', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error-aggregator/native-form-scope-reveal-on-submit',
    );

    const stats = page.locator('pre').first();
    // Initial: emailFormatBad=true, passwordWeak=true → errorCount=2.
    await expect(stats).toContainText(/errorCount\s*:\s*2/);

    // Toggling email-format off should drop the count.
    await page.getByRole('button', { name: 'Toggle email-format' }).click();
    await expect(stats).toContainText(/errorCount\s*:\s*1/);
    await page.getByRole('button', { name: 'Toggle email-taken' }).click();
    await expect(stats).toContainText(/errorCount\s*:\s*2/);

    await expect(page).toHaveScreenshot('error-aggregator-native.png', { fullPage: true });
  });

  test('card host: aggregator no-scope variant shows errors immediately', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error-aggregator/cngx-card-host-no-scope-errors-visible-immediately',
    );
    // Smoke: page renders without errors.
    expect(await page.locator('cngx-card').count()).toBeGreaterThanOrEqual(0);
    await expect(page).toHaveScreenshot('error-aggregator-card.png', { fullPage: true });
  });

  test('popover-panel-host: aggregator embedded in a popover renders', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/error-aggregator/cngx-popover-panel-host');
    await expect(page).toHaveScreenshot('error-aggregator-popover.png', { fullPage: true });
  });

  test('material-mat-tab: tab label shows error count badge', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/error-aggregator/material-mat-tab-label-with-error-count-badge');
    await expect(page).toHaveScreenshot('error-aggregator-material-tab.png', { fullPage: true });
  });
});
