import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// The classic strip's `density: 'auto'` ladder is driven by the strip's
// own container width (ResizeObserver), not the viewport. The width is
// forced via an injected stylesheet (same technique as
// stepper-container-responsive) so the rung transitions are deterministic
// regardless of the runner's viewport. Breakpoints in the demo are tuned
// to { compact: 48, minimal: 28 } px per step across 15 steps:
//   >= 720px -> full, >= 420px -> compact, < 420px -> minimal.

test.describe('ui/stepper/stepper-density', () => {
  test('degrades full -> compact -> minimal on container width, no horizontal scroll at minimal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, 'ui/stepper/stepper-density/flat-fifteen-steps-auto-density');

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    await page.addStyleTag({ content: 'cngx-stepper { width: 900px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'full');

    await page.addStyleTag({ content: 'cngx-stepper { width: 540px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'compact');

    await page.addStyleTag({ content: 'cngx-stepper { width: 300px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'minimal');
    await expect(stepper).toHaveAttribute('aria-orientation', 'vertical');

    // The minimal rung stacks the strip vertically instead of overflowing,
    // so no horizontal scrollbar appears.
    const overflow = await stepper
      .locator('.cngx-stepper__strip')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('the active step keeps its visible label at the minimal rung', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, 'ui/stepper/stepper-density/flat-fifteen-steps-auto-density');

    const stepper = page.locator('cngx-stepper').first();
    await page.addStyleTag({ content: 'cngx-stepper { width: 300px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'minimal');

    // The active (first) step's label is rendered, not sr-only-clipped.
    const activeLabel = stepper.locator('button.cngx-stepper__step').first().locator('.cngx-stepper__label');
    await expect(activeLabel).toHaveText('Source');
    await expect(activeLabel).toBeVisible();
  });
});
