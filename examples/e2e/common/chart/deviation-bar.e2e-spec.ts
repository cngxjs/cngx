import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxDeviationBar renders a value relative to a baseline.
// Negative values fill leftwards, positive fill rightwards, zero is
// a single mark on the baseline.

test.describe('common/chart/deviation-bar', () => {
  // TODO(examples-e2e-quarantine-2): the story binds [attr.aria-label], which the
  // host binding on cngx-deviation-bar (deviation-bar.component.ts:42) overwrites with null, so the
  // preset ships unnamed under role="meter". The assertion is correct; the story
  // is wrong. Story fix is out of scope for an e2e PR (see the de-rot plan's
  // Out-of-Scope rule); filed separately.
  test.fixme('variance-readings: positive, negative and zero fills appear distinctly', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/chart/deviation-bar/variance-readings');

    const bars = page.locator('cngx-deviation-bar');
    await expect(bars).toHaveCount(3);

    // Q1 (+45) renders a positive fill, Q2 (-30) renders a negative fill.
    await expect(bars.nth(0).locator('.cngx-deviation-bar__fill--positive')).toHaveCount(1);
    await expect(bars.nth(0).locator('.cngx-deviation-bar__fill--negative')).toHaveCount(0);

    await expect(bars.nth(1).locator('.cngx-deviation-bar__fill--negative')).toHaveCount(1);
    await expect(bars.nth(1).locator('.cngx-deviation-bar__fill--positive')).toHaveCount(0);

    // Each bar must paint its baseline mark.
    for (let i = 0; i < 3; i++) {
      await expect(bars.nth(i).locator('.cngx-deviation-bar__baseline')).toHaveCount(1);
    }

    await expect(bars.nth(0)).toHaveAttribute('aria-label', /Q1 budget \+45/);
    await expect(bars.nth(1)).toHaveAttribute('aria-label', /Q2 budget -30/);

  });

  test('async-state-machine: status changes follow the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/deviation-bar/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    await expect(page.locator('cngx-deviation-bar .cngx-deviation-bar__track')).toHaveCount(1);

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });
});
