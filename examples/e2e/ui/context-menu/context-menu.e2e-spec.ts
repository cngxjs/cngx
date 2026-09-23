import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesUnder } from '../../_routes';

// Story: CngxContextMenu — declarative context-menu organism docked onto
// targets via [cngxContextMenuFor]. Static items, delegated
// resolver over a grid, nested submenu, checkbox/radio items, native-button
// attribute form, and the per-row data table from Phase 2.

test.describe('ui/context-menu', () => {
  for (const { name, path } of routesUnder('ui', 'context-menu')) {
    test(`${name}: renders without errors`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }

  test('static-items: right-click opens the menu, Escape dismisses it', async ({ page }) => {
    await gotoDemo(page, 'ui/context-menu/basic/static-items');
    await expect(page.locator('header.cngx-ex-intro')).toBeVisible();

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeHidden();

    await page.locator('.demo-ctx-zone').first().click({ button: 'right' });
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Copy', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });
});
