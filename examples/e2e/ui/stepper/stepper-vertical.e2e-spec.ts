import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepper with orientation="vertical" renders the strip as
// a sidebar. Clicking strip items navigates.

test.describe('ui/stepper/stepper-vertical', () => {
  test('vertical-sidebar: 4 steps render with vertical orientation', async ({ page }) => {
    await gotoDemo(page, 'ui/stepper/stepper-vertical/vertical-sidebar-layout');

    const stepper = page.locator('cngx-stepper');
    await expect(stepper).toHaveAttribute('data-orientation', /vertical/i);
    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(4);

    await steps.nth(2).click();
    const active = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active step', { exact: true }) })
      .locator('.event-value');
    await expect(active).toHaveText('2');

    await expect(page).toHaveScreenshot('stepper-vertical.png', { fullPage: true });
  });
});
