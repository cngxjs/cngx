import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// The classic strip's `density: 'auto'` ladder is driven by the strip's
// own container width (ResizeObserver), not the viewport. The width is
// forced via an injected stylesheet (same technique as
// stepper-container-responsive) so the rung transitions are deterministic
// regardless of the runner's viewport. The demo tunes the thresholds to
// { compact: 165, minimal: 135 } px per step across 6 steps:
//   >= 990px -> full, >= 810px -> compact, < 810px -> minimal.

const ROUTE = 'ui/stepper/stepper-density/flat-steps-auto-density';

async function horizontalOverflow(stepper: import('@playwright/test').Locator): Promise<number> {
  return stepper.locator('.cngx-stepper__strip').evaluate((el) => el.scrollWidth - el.clientWidth);
}

test.describe('ui/stepper/stepper-density', () => {
  test('degrades full -> compact -> minimal on container width, no scrollbar at any rung', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    await page.addStyleTag({ content: 'cngx-stepper { width: 1020px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'full');
    expect(await horizontalOverflow(stepper)).toBeLessThanOrEqual(1);

    await page.addStyleTag({ content: 'cngx-stepper { width: 900px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'compact');
    // The user-reported failure was a horizontal scrollbar here - the
    // compact rung must fit its container.
    expect(await horizontalOverflow(stepper)).toBeLessThanOrEqual(1);

    await page.addStyleTag({ content: 'cngx-stepper { width: 480px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'minimal');
    await expect(stepper).toHaveAttribute('aria-orientation', 'vertical');
    expect(await horizontalOverflow(stepper)).toBeLessThanOrEqual(1);
  });

  test('the active step keeps its visible label at the minimal rung', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await page.addStyleTag({ content: 'cngx-stepper { width: 480px !important; display: block; }' });
    await expect(stepper).toHaveAttribute('data-density', 'minimal');

    // The active (first) step's label is rendered, not sr-only-clipped.
    const activeLabel = stepper
      .locator('button.cngx-stepper__step')
      .first()
      .locator('.cngx-stepper__label');
    await expect(activeLabel).toHaveText('Repository');
    await expect(activeLabel).toBeVisible();
  });
});
