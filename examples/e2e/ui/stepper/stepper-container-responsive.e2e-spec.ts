import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// The `.cngx-stepper` host carries `container-type: inline-size` +
// `container-name: cngx-stepper` so panel padding responds to host
// width via `@container cngx-stepper (max-width: 600px)`, independent
// of viewport width. Verified by forcing the host width with an
// injected stylesheet rather than resizing the viewport.

test.describe('ui/stepper/stepper-container-responsive', () => {
  test('panel padding tightens when the stepper host is narrower than 600px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-horizontal/three-step-wizard');

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    const containerInline = await stepper.evaluate(
      (el) => getComputedStyle(el).containerType,
    );
    expect(containerInline).toBe('inline-size');

    const baselinePanel = stepper.locator('.cngx-stepper__panel').first();
    const baseline = await baselinePanel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft) };
    });

    await page.addStyleTag({
      content: 'cngx-stepper { width: 400px !important; display: block; }',
    });

    const narrowPanel = stepper.locator('.cngx-stepper__panel').first();
    const narrow = await narrowPanel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft) };
    });

    expect(narrow.top).toBeLessThan(baseline.top);
    expect(narrow.left).toBeLessThan(baseline.left);
  });

  test('panel padding stays at the desktop default when the host is wider than 600px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-horizontal/three-step-wizard');

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    const baseline = await stepper.locator('.cngx-stepper__panel').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft) };
    });

    await page.addStyleTag({
      content: 'cngx-stepper { width: 900px !important; display: block; }',
    });

    const wide = await stepper.locator('.cngx-stepper__panel').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { top: parseFloat(cs.paddingTop), left: parseFloat(cs.paddingLeft) };
    });

    expect(wide.top).toBe(baseline.top);
    expect(wide.left).toBe(baseline.left);
  });
});
