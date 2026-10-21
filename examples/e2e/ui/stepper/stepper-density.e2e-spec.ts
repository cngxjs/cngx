import type { Locator } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// The classic strip's `density: 'auto'` shrinks its labels in flow within a
// cqi budget of the strip's own container width, not the viewport. The width
// is forced via an injected stylesheet (same technique as
// stepper-container-responsive) so the result is deterministic regardless of
// the runner's viewport. Below 30rem the stepper collapses and renders no
// strip, so every width here stays above it.

const ROUTE = 'ui/stepper/stepper-density/flat-steps-auto-density';

async function horizontalOverflow(stepper: Locator): Promise<number> {
  return stepper.locator('.cngx-stepper__strip').evaluate((el) => el.scrollWidth - el.clientWidth);
}

test.describe('ui/stepper/stepper-density', () => {
  test('no horizontal scrollbar at 620 / 560 / 500 px, orientation stays horizontal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();
    await expect(stepper).toHaveAttribute('data-density-auto', '');

    for (const width of [620, 560, 500]) {
      await page.addStyleTag({
        content: `cngx-stepper { width: ${width}px !important; display: block; }`,
      });
      // The user-reported failure was a horizontal scrollbar on a narrow
      // strip - the labels must shrink to fit their container instead.
      await expect
        .poll(() => horizontalOverflow(stepper), { message: `overflow at ${width}px` })
        .toBeLessThanOrEqual(1);
      // A horizontal stepper stays horizontal - never an auto-vertical stack.
      await expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');
    }
  });

  test('never grows a horizontal scrollbar across the whole width range', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    // Sweep the container width across the ladder; the strip must fit at
    // every step (labels shrink/truncate in flow), never overflow. The sweep
    // starts at the 30rem collapse rung - below it there is no strip to measure.
    for (let width = 500; width <= 700; width += 20) {
      await page.addStyleTag({
        content: `cngx-stepper { width: ${width}px !important; display: block; }`,
      });
      await expect
        .poll(() => horizontalOverflow(stepper), { message: `overflow at ${width}px` })
        .toBeLessThanOrEqual(1);
    }
  });

  test('the active step keeps its visible label on a narrow strip', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await page.addStyleTag({
      content: 'cngx-stepper { width: 500px !important; display: block; }',
    });

    // The active (first) step's label is rendered, not sr-only-clipped.
    const activeLabel = stepper
      .locator('button.cngx-stepper__step')
      .first()
      .locator('.cngx-stepper__label');
    await expect(activeLabel).toHaveText('Connect repository');
    await expect(activeLabel).toBeVisible();
  });
});
