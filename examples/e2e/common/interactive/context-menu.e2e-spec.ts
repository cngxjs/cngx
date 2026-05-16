import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxContextMenuTrigger opens a CngxMenu inside a CngxPopover on
// right-click or Shift+F10. Arrow keys navigate; Enter activates and
// fires (itemActivated); the demo binds Last action to the activated value.

test.describe('common/interactive/context-menu', () => {
  test('right-click-target-zone: right-click opens menu, item click sets Last action', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/context-menu/right-click-target-zone');

    const zone = page.locator('.zone');
    await expect(zone).toBeVisible();

    await zone.click({ button: 'right' });
    const menu = page.getByRole('menu', { name: 'Context actions' });
    await expect(menu).toBeVisible();

    // Click "Copy" item — Last action signal must update.
    await page.getByRole('menuitem', { name: 'Copy' }).click();

    const lastAction = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last action', { exact: true }) })
      .locator('.event-value');
    await expect(lastAction).toHaveText('copy');
    // Menu must close after activation.
    await expect(menu).toHaveCount(0);

    await expect(page).toHaveScreenshot('context-menu-after-copy.png', { fullPage: true });
  });
});
