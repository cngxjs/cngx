import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxStepper supports per-step label overrides via the
// `<ng-template cngxStepLabel>` slot. The first step uses the plain
// `[label]` input; the others project a custom template with an icon
// glyph, the label text, and a reactive counter chip.

test.describe('ui/stepper/stepper-custom-labels', () => {
  test('custom-template slots render icon + label + reactive counter', async ({ page }) => {
    await gotoDemo(
      page,
      'ui/stepper/stepper-custom-labels/mixing-code-label-code-input-with-code-cngxsteplabel-code-slot',
    );

    const steps = page.locator('button.cngx-stepper__step');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(0)).toContainText('Profile');
    await expect(steps.nth(1)).toContainText('Notifications');
    // Notifications step renders the bell glyph from the custom template.
    await expect(steps.nth(1)).toContainText('🔔');
    await expect(steps.nth(2)).toContainText('Security');
    await expect(steps.nth(2)).toContainText('🔒');

    // Counter chip reflects the reactive `notificationCount` signal. Press +1
    // and assert the chip on the strip climbs by at least 1 from its initial.
    await steps.nth(1).click();
    const countOnStrip = async (): Promise<number> => {
      const txt = (await steps.nth(1).textContent()) ?? '';
      // The strip label looks like "2🔔 Notifications <N> Step 2 of 4: ...".
      // The first digit between "Notifications" and "Step" is the chip value.
      const m = txt.match(/Notifications\s*(\d+)/);
      return parseInt(m?.[1] ?? '0', 10);
    };
    const before = await countOnStrip();
    await page.getByRole('button', { name: '+1 notification' }).click();
    await expect.poll(countOnStrip, { timeout: 2000 }).toBeGreaterThan(before);

  });
});
