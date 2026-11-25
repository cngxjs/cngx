import { expect, test } from '../../_test';
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

  test('native form: submit reveals through one status region and speaks again', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error/aggregator/native-form-scope-reveal-on-submit',
    );
    const shouldShow = page
      .locator('.event-row')
      .filter({ has: page.getByText('shouldShow()', { exact: true }) })
      .locator('.event-value');
    const form = page.locator('form[cngxErrorScope]');

    await page.locator('#cngx-error-signup-email').fill('not-an-email');
    await expect(shouldShow).toHaveText('false');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(shouldShow).toHaveText('true');

    await expect(form.locator('[role="alert"]')).toHaveCount(0);
    const region = form.locator('[role="status"]');
    await expect(region).toHaveCount(1);
    await expect(region).toHaveText('Email format invalid, Password too weak');

    await region.evaluate((el) => {
      const w = window as unknown as { __pr4Mutations: number };
      w.__pr4Mutations = 0;
      new MutationObserver((list) => (w.__pr4Mutations += list.length)).observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __pr4Mutations: number }).__pr4Mutations))
      .toBeGreaterThan(0);
    await expect(region).toHaveText('Email format invalid, Password too weak');
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
    // [autoAnnounce]="false": the role="alert" list is the only announcement path.
    await expect(page.locator('[cngxErrorAggregator] [role="status"]')).toHaveCount(0);
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

  test('material-mat-tab: the tab name carries its error count and one region speaks for both tabs', async ({
    page,
  }) => {
    await gotoDemo(
      page,
      'common/interactive/error/aggregator/material-mat-tab-label-with-error-count-badge',
    );
    await expect(page.getByRole('tab', { name: /^Payment\W+1 error$/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Address\W+1 error$/ })).toBeVisible();

    // The Address tab is active, so the Payment body is detached: the region
    // outside the tab group is the only place its error can be spoken.
    const region = page.locator('.cngx-ex-artifact [role="status"].demo-sr-only');
    await expect(region).toHaveCount(1);
    await expect(region).toContainText('Card number invalid');

    await page.getByRole('button', { name: 'Toggle payment error' }).click();
    await expect(region).not.toContainText('Card number invalid');
    await expect(region).toContainText('Street and city are required');
    await expect(page.getByRole('tab', { name: 'Payment', exact: true })).toBeVisible();
  });
});
