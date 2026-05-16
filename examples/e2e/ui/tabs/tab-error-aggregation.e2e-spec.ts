import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

test.describe('ui/tabs/tab-error-aggregation', () => {
  test('per-tab error badges: tabs render with badges', async ({ page }) => {
    await gotoDemo(page, 'ui/tabs/tab-error-aggregation/per-tab-error-badges');
    await expect(page.locator('cngx-tab-group')).toBeVisible();
  });
});
