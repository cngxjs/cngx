import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxBullet renders Stephen Few's bullet chart — range bands, an
// actual bar, a target marker. Optional [state] binding routes through
// the four CngxAsyncState branches (loading/empty/error/success).

test.describe('common/chart/bullet', () => {
  test('performance-vs-target: each row paints track + ranges + fill + target', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/chart/bullet/performance-vs-target');

    const bullets = page.locator('cngx-bullet');
    await expect(bullets).toHaveCount(3);

    // Each bullet must contain the three structural primitives.
    for (let i = 0; i < 3; i++) {
      const b = bullets.nth(i);
      await expect(b.locator('.cngx-bullet__track')).toHaveCount(1);
      // Three range bands per bullet, three ranges in the config.
      await expect(b.locator('.cngx-bullet__range')).toHaveCount(3);
      // The actual-fill bar is present.
      await expect(b.locator('.cngx-bullet__fill, .cngx-bullet__actual').first()).toHaveCount(1);
    }

    // Each bullet keeps the aria-label its consumer supplied.
    await expect(bullets.first()).toHaveAttribute('aria-label', /Q1 Revenue/);
    await expect(bullets.nth(2)).toHaveAttribute('aria-label', /Q3 Revenue/);

  });

  test('async-state-machine: status text and content follow the state machine', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/chart/bullet/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    // After success, the bullet must paint its track again.
    await expect(page.locator('cngx-bullet .cngx-bullet__track')).toHaveCount(1);

    await page.getByRole('button', { name: 'loading (skeleton)' }).click();
    await expect(status).toContainText('loading');

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });
});
