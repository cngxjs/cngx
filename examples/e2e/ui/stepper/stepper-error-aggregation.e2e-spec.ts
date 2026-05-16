import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

test.describe('ui/stepper/stepper-error-aggregation', () => {
  test('per-step error badges: stepper renders with badges', async ({ page }) => {
    await gotoDemo(page, 'ui/stepper/stepper-error-aggregation/per-step-error-badges');
    await expect(page.locator('cngx-stepper')).toBeVisible();
    await expect(page).toHaveScreenshot('stepper-error-aggregation.png', { fullPage: true });
  });
});
