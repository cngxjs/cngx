import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// The `.cngx-stepper` host carries `container-type: inline-size` +
// `container-name: cngx-stepper`, so both responsive rungs answer to the
// stepper's own width and never to the viewport:
//
//   48rem - panel padding tightens (sidebar / card / dialog)
//   30rem - the classic strip collapses to the compact count
//
// Verified by forcing the host width with an injected stylesheet at a fixed
// wide viewport; the demo card is itself narrower than 48rem, so each width is
// pinned explicitly rather than read off the page.

const DEMO = 'ui/stepper/stepper-horizontal/three-step-wizard';

/** Panel padding at a forced host width. */
async function paddingAt(
  page: Page,
  width: string,
): Promise<{ top: number; left: number }> {
  await page.addStyleTag({
    content: `cngx-stepper { width: ${width} !important; display: block; }`,
  });
  return page
    .locator('cngx-stepper .cngx-stepper__panel')
    .first()
    .evaluate((el) => {
      const cs = getComputedStyle(el);
      return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft) };
    });
}

test.describe('ui/stepper/stepper-container-responsive', () => {
  test('declares itself as the query container', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, DEMO);

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();
    expect(
      await stepper.evaluate((el) => ({
        type: getComputedStyle(el).containerType,
        name: getComputedStyle(el).containerName,
      })),
    ).toEqual({ type: 'inline-size', name: 'cngx-stepper' });
  });

  test('tightens the panel padding below the 48rem rung, at any viewport width', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, DEMO);
    await expect(page.locator('cngx-stepper').first()).toBeVisible();

    // Wide host on a wide viewport: the default padding.
    const wide = await paddingAt(page, '900px');
    // Narrow host on the SAME wide viewport: compact. A viewport-driven rule
    // could not tell these apart - that is the regression this pins. 600px sits
    // between the two rungs, so this isolates the padding rung from the strip
    // collapse one rung below.
    const narrow = await paddingAt(page, '600px');

    // Block axis only: the host derives both paddings from the space scale
    // (`--cngx-step-padding: sm sm`, `--cngx-step-padding-compact: xs sm`), so
    // the compact rung tightens the block axis and deliberately leaves the
    // inline axis on the same rung.
    expect(narrow.top).toBeLessThan(wide.top);
    expect(narrow.left).toBe(wide.left);
  });

  test('collapses the strip below the 30rem rung, at any viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, DEMO);
    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    await page.addStyleTag({
      content: 'cngx-stepper { width: 900px !important; display: block; }',
    });
    await expect(stepper.locator('.cngx-stepper__strip')).toBeVisible();

    await page.addStyleTag({
      content: 'cngx-stepper { width: 400px !important; display: block; }',
    });
    await expect(stepper.locator('.cngx-stepper__mobile-text')).toBeVisible();
    await expect(stepper.locator('.cngx-stepper__strip')).toHaveCount(0);
  });
});
