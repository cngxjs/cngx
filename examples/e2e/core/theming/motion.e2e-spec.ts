import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';

import { gotoDemo } from '../../_helpers';

// Under an OS reduce, the ui loading surfaces swap to the opacity pulse. An
// explicit "Full" choice (data-motion='full' on <html>) opts the whole
// document back into motion, so the spinner keeps its spin. The pulse rules
// sit outside @scope for that reason; a scoped @media block cannot read the
// root attribute.

function spinnerAnimation(page: Page): Promise<string> {
  return page
    .locator('cngx-loading-indicator .cngx-loading-indicator__spinner')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
}

test.describe('core/theming - motion switch under an OS reduce', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoDemo(page, 'core/theming/motion/switch');
    await expect(page.locator('cngx-loading-indicator').first()).toBeVisible();
  });

  test('Full keeps the spinner spinning', async ({ page }) => {
    await page.getByRole('radio', { name: 'Full' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
    expect(await spinnerAnimation(page)).not.toBe('cngx-pulse');
  });

  test('Auto follows the OS and pulses the spinner', async ({ page }) => {
    await page.getByRole('radio', { name: 'Auto' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.+/);
    expect(await spinnerAnimation(page)).toBe('cngx-pulse');
  });
});
