import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMenuTrigger wires a button to a popover-hosted CngxMenu.
// Clicking the trigger opens the menu; clicking an item activates it.

test.describe('common/interactive/menu-trigger', () => {
  test('dropdown-menu: click opens, ArrowDown navigates, Enter activates', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/menu-trigger/dropdown-menu');

    const trigger = page.getByRole('button', { name: 'Actions' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await trigger.click();

    const menu = page.getByRole('menu', { name: 'File actions' });
    await expect(menu).toBeVisible();

    const save = page.getByRole('menuitem', { name: 'Save' });
    await save.click();

    const lastAction = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last action', { exact: true }) })
      .locator('.event-value');
    await expect(lastAction).toHaveText('save');

  });
});
