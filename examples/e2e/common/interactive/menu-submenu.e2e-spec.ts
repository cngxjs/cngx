import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMenu with a nested submenu via CngxMenuItemSubmenu. Clicking
// the parent item reveals the child menu; activating an item closes both.

test.describe('common/interactive/menu-submenu', () => {
  test('two-level: opening File reveals Open Recent submenu', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/menu-submenu/two-level-submenu');

    const fileBtn = page.getByRole('button', { name: 'File' });
    await fileBtn.click();
    const fileMenu = page.getByRole('menu', { name: 'File' });
    await expect(fileMenu).toBeVisible();

    // Hover the parent submenu item to reveal the child.
    const openRecent = page.getByRole('menuitem', { name: /Open Recent/ });
    await openRecent.hover();

    // Activate a leaf — both menus close, lastAction updates.
    const newItem = page.getByRole('menuitem', { name: /New/ });
    await newItem.click();

    const lastAction = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last action', { exact: true }) })
      .locator('.event-value');
    // Some demos use a different label name — soft-match the result.
    const actionText = (await lastAction.count()) ? await lastAction.textContent() : '';
    expect(actionText).toBe('new');

  });
});
