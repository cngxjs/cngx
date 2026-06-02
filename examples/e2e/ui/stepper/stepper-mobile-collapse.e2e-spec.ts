import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepper mobile auto-collapse. At 375px viewport the classic
// strip collapses to an inline mobile-text span driven by the outer
// presenter; at desktop width the strip renders normally.

test.describe('ui/stepper/stepper-mobile-collapse', () => {
  test('auto-collapse: 375px viewport renders the inline text fallback instead of the strip', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-mobile-collapse/auto-collapse');

    await expect(page.locator('.cngx-stepper__mobile-text')).toBeVisible();
    await expect(page.locator('.cngx-stepper__mobile-text')).toContainText('Step 1 of 3');
    await expect(page.locator('button.cngx-stepper__step')).toHaveCount(0);
  });

  test('desktop viewport keeps the classic strip rendered', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-mobile-collapse/auto-collapse');

    await expect(page.locator('.cngx-stepper__mobile-text')).toHaveCount(0);
    await expect(page.locator('button.cngx-stepper__step')).toHaveCount(3);
  });
});
