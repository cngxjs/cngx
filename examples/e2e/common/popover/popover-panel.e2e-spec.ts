import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPopoverPanel renders a styled panel attached to a trigger.

test.describe('common/popover/popover-panel', () => {
  test('content-states: panel mounts under its trigger', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/content-states');
    const triggers = page.getByRole('button');
    expect(await triggers.count()).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('popover-panel-content-states.png', { fullPage: true });
  });

  test('variants: panel variants render', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/variants');
    await expect(page).toHaveScreenshot('popover-panel-variants.png', { fullPage: true });
  });

  test('with-footer-actions: panel includes a footer actions row', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/with-footer-actions');
    await expect(page).toHaveScreenshot('popover-panel-footer.png', { fullPage: true });
  });
});
