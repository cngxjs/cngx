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

    const baselinePanel = stepper.locator('.cngx-stepper__panel').first();
    const baselinePadding = await baselinePanel.evaluate(
      (el) => getComputedStyle(el).padding,
    );
    expect(baselinePadding).toBe('8px 12px');

    await page.addStyleTag({
      content: 'cngx-stepper { width: 400px !important; display: block; }',
    });

    const containerInline = await stepper.evaluate(
      (el) => getComputedStyle(el).containerType,
    );
    expect(containerInline).toBe('inline-size');

    const narrowPanel = stepper.locator('.cngx-stepper__panel').first();
    const narrowPadding = await narrowPanel.evaluate(
      (el) => getComputedStyle(el).padding,
    );
    expect(narrowPadding).toBe('6px 8px');
  });

  test('panel padding stays at the desktop default when the host is wider than 600px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, 'ui/stepper/stepper-horizontal/three-step-wizard');

    const stepper = page.locator('cngx-stepper').first();
    await expect(stepper).toBeVisible();

    await page.addStyleTag({
      content: 'cngx-stepper { width: 900px !important; display: block; }',
    });

    const panel = stepper.locator('.cngx-stepper__panel').first();
    const padding = await panel.evaluate((el) => getComputedStyle(el).padding);
    expect(padding).toBe('8px 12px');
  });
});
