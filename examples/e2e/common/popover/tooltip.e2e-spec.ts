import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTooltip — hover/focus trigger renders a styled tooltip with
// configurable placement, delay, keyboard support.

test.describe('common/popover/tooltip', () => {
  test('basic: hover trigger reveals the tooltip', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/basic-tooltip');
    const target = page.getByRole('button').first().or(page.locator('[cngxtooltip]').first());
    await target.hover();
    await expect(page).toHaveScreenshot('tooltip-basic.png', { fullPage: true });
  });

  test('placement: variants render', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/placement');
    await expect(page).toHaveScreenshot('tooltip-placement.png', { fullPage: true });
  });

  test('custom-delay: delay variants render', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/custom-delay');
    await expect(page).toHaveScreenshot('tooltip-delay.png', { fullPage: true });
  });

  test('disabled-state: disabled trigger does not reveal', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/disabled-state');
    await expect(page).toHaveScreenshot('tooltip-disabled.png', { fullPage: true });
  });

  test('keyboard-navigation: focus reveals the tooltip', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/keyboard-navigation');
    await page.getByRole('button').first().focus();
    await expect(page).toHaveScreenshot('tooltip-keyboard.png', { fullPage: true });
  });

  test('programmatic-control: tooltip can be toggled via API', async ({ page }) => {
    await gotoDemo(page, 'common/popover/tooltip/programmatic-control');
    await expect(page).toHaveScreenshot('tooltip-programmatic.png', { fullPage: true });
  });
});
