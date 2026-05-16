import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMiniBar is a single-value bounded indicator rendered in pure
// DOM (no SVG). The host carries role="meter" and reactive aria-valuenow.

test.describe('common/chart/mini-bar', () => {
  test('basic-readings: three bars rendered as meters with aria values', async ({ page }) => {
    await gotoDemo(page, 'common/chart/mini-bar/basic-readings');

    const bars = page.locator('cngx-mini-bar');
    await expect(bars).toHaveCount(3);

    // Each bar must paint as role=meter with the matching value.
    const meters = page.getByRole('meter');
    await expect(meters).toHaveCount(3);

    await expect(bars.first()).toHaveAttribute('aria-valuenow', '78');
    await expect(bars.nth(1)).toHaveAttribute('aria-valuenow', '42');
    await expect(bars.nth(2)).toHaveAttribute('aria-valuenow', '12');

  });

  test('async-state-machine: status follows the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/mini-bar/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    await expect(page.getByRole('meter')).toHaveCount(1);

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });
});
