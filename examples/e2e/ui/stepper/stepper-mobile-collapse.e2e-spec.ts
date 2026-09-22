import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepper mobile auto-collapse. The collapse follows the stepper's
// OWN container width (30rem), not the viewport; at a 375px viewport the demo
// card is narrow enough that the classic strip collapses to an inline
// mobile-text span driven by the outer presenter, and at desktop width the
// strip renders normally. The axis itself is pinned in
// stepper-container-responsive, which forces the host width at a wide viewport.

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

// Story: CngxStepper mobile auto-collapse with dots mode. The demo opts
// into `withStepperMobileCollapse('dots')` via viewProviders, so the
// narrow-container fallback renders an inline row of dot buttons instead
// of the default text span.

test.describe('ui/stepper/stepper-mobile-collapse-dots', () => {
  test('dots-collapse: 375px viewport renders the inline dot buttons instead of the strip', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-mobile-collapse/dots-collapse');

    await expect(page.locator('button.cngx-stepper__mobile-dot')).toHaveCount(3);
    // The dots branch of this demo also renders the count as a CAPTION under the
    // dot row ([showStepCount]="true"); what must be absent is the text-mode
    // span, which is the same class without the caption modifier.
    await expect(
      page.locator('.cngx-stepper__mobile-text:not(.cngx-stepper__mobile-text--caption)'),
    ).toHaveCount(0);
    await expect(page.locator('button.cngx-stepper__step')).toHaveCount(0);
  });

  test('dots-collapse: desktop viewport keeps the classic strip rendered', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-mobile-collapse/dots-collapse');

    await expect(page.locator('button.cngx-stepper__mobile-dot')).toHaveCount(0);
    await expect(page.locator('button.cngx-stepper__step')).toHaveCount(3);
  });
});
