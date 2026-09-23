import { expect, test, type Locator } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// The classic strip's `density: 'auto'` ladder is driven by the strip's
// own container width (ResizeObserver), not the viewport. The width is
// forced via an injected stylesheet (same technique as
// stepper-container-responsive) so the rung transitions are deterministic
// regardless of the runner's viewport. The demo tunes the thresholds to
// { compact: 145, minimal: 120 } px per step across 4 steps:
//   >= 580px -> full, >= 480px -> compact, < 480px -> minimal.

const ROUTE = 'ui/stepper/stepper-density/flat-steps-auto-density';

async function horizontalOverflow(stepper: Locator): Promise<number> {
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

    await page.addStyleTag({
      content: 'cngx-stepper { width: 620px !important; display: block; }',
    });
    await expect(stepper).toHaveAttribute('data-strip-density', 'full');
    expect(await horizontalOverflow(stepper)).toBeLessThanOrEqual(1);

    await page.addStyleTag({
      content: 'cngx-stepper { width: 560px !important; display: block; }',
    });
    await expect(stepper).toHaveAttribute('data-strip-density', 'compact');
    // The user-reported failure was a horizontal scrollbar here - the
    // compact rung must fit its container.
    expect(await horizontalOverflow(stepper)).toBeLessThanOrEqual(1);

    await page.addStyleTag({
      content: 'cngx-stepper { width: 500px !important; display: block; }',
    });
    await expect(stepper).toHaveAttribute('data-strip-density', 'minimal');
    // A horizontal stepper stays horizontal at minimal - it degrades to an
    // indicators-only row, never an auto-vertical stack.
    await expect(stepper).toHaveAttribute('aria-orientation', 'horizontal');
    expect(await horizontalOverflow(stepper)).toBeLessThanOrEqual(1);
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

  test('the active step keeps its visible label at the minimal rung', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoDemo(page, ROUTE);

    const stepper = page.locator('cngx-stepper').first();
    await page.addStyleTag({
      content: 'cngx-stepper { width: 500px !important; display: block; }',
    });
    await expect(stepper).toHaveAttribute('data-strip-density', 'minimal');

    // The active (first) step's label is rendered, not sr-only-clipped.
    const activeLabel = stepper
      .locator('button.cngx-stepper__step')
      .first()
      .locator('.cngx-stepper__label');
    await expect(activeLabel).toHaveText('Connect repository');
    await expect(activeLabel).toBeVisible();
  });
});
