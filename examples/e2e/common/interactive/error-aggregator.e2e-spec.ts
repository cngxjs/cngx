import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxErrorAggregator + CngxErrorScope reveal errors on submit.
// Toggling error sources updates hasError / errorCount; reveal()
// (submit) gates list visibility via shouldShow().

test.describe('common/interactive/error-aggregator', () => {
  test('native form: errorCount reflects toggled sources', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error/aggregator/native-form-scope-reveal-on-submit',
    );

    // Scope to the readout, not `pre` — every demo's code panel also contains
    // the literal `errorCount`, so a `pre` match proves nothing.
    const errorCount = page
      .locator('.event-row')
      .filter({ has: page.getByText('errorCount()', { exact: true }) })
      .locator('.event-value');

    // Initial: emailFormatBad=true, passwordWeak=true -> errorCount=2.
    await expect(errorCount).toHaveText('2');

    await page.getByRole('button', { name: 'Toggle email-format' }).click();
    await expect(errorCount).toHaveText('1');
    await page.getByRole('button', { name: 'Toggle email-taken' }).click();
    await expect(errorCount).toHaveText('2');

  });

  test('card host: aggregator no-scope variant shows errors immediately', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error/aggregator/cngx-card-host-no-scope-errors-visible-immediately',
    );
    // The no-scope variant reveals immediately: no submit, no blur.
    const errors = page.locator('cngx-card [role="alert"]');
    await expect(errors).toBeVisible();
    await expect(errors.locator('li')).not.toHaveCount(0);
  });

  test('popover-panel-host: aggregator embedded in a popover renders', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/error/aggregator/cngx-popover-panel-host');

    await page.getByRole('button', { name: /Billing status/ }).click();
    const errors = page.locator('[role="alert"]');
    await expect(errors).toBeVisible();
    await expect(errors.locator('li')).not.toHaveCount(0);
  });

  test('material-mat-tab: tab label shows error count badge', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error/aggregator/material-mat-tab-label-with-error-count-badge',
    );

    // The badge only renders while errorCount() > 0, so its presence IS the
    // assertion; it is also aria-hidden, hence the class locator.
    const badge = page.locator('.demo-error-count-badge').first();
    await expect(badge).toBeVisible();
    await expect(badge).not.toHaveText('0');
  });
});
