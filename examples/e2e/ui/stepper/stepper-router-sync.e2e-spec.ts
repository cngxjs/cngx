import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepperRouterSync syncs the active step with the URL. Strip
// click should reflect into the chosen URL slot (fragment or queryParam).

test.describe('ui/stepper/stepper-router-sync', () => {
  test('deep-linking: switching step propagates to the URL fragment', async ({ page }) => {
    await gotoDemo(page, 'ui/stepper/stepper-router-sync/deep-linking-with-fragment-queryparam-modes');

    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(4);

    await steps.nth(2).click();
    const active = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active step', { exact: true }) })
      .locator('.event-value');
    await expect(active).toHaveText('2');

    // Defaults to fragment mode — the URL fragment must now contain
    // step=cngx-step-2 (the generated step id) or the demo's id "security".
    await expect
      .poll(() => page.url(), { timeout: 2000 })
      .toMatch(/step=(cngx-step-2|security)/);

    await expect(page).toHaveScreenshot('stepper-router-sync.png', { fullPage: true });
  });
});
