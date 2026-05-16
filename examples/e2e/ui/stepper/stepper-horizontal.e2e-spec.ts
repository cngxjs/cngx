import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepper horizontal. Next/Previous buttons advance the strip;
// activeStepIndex reflects the current position.

test.describe('ui/stepper/stepper-horizontal', () => {
  test('three-step-wizard: Next/Previous move activeStepIndex', async ({ page }) => {
    await gotoDemo(page, 'ui/stepper/stepper-horizontal/three-step-wizard');

    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(3);

    const active = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active step', { exact: true }) })
      .locator('.event-value');
    await expect(active).toHaveText('0');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(active).toHaveText('1');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(active).toHaveText('2');
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(active).toHaveText('1');

  });
});
