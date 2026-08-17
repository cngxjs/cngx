import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxContextMenu — declarative context-menu organism docked onto
// targets via [cngxContextMenuFor]. Six routes: static items, delegated
// resolver over a grid, nested submenu, checkbox/radio items, native-button
// attribute form, and the per-row data table from Phase 2.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['static-items', 'ui/context-menu/basic/static-items'],
  ['delegated-resolver', 'ui/context-menu/grid/delegated-resolver'],
  ['nested-submenu', 'ui/context-menu/submenu/nested-export-menu'],
  ['checkbox-radio', 'ui/context-menu/selection/checkbox-radio-items'],
  ['native-buttons', 'ui/context-menu/attribute-form/native-buttons'],
  ['row-context-data', 'ui/context-menu/table/row-context-data'],
];

test.describe('ui/context-menu', () => {
  for (const [name, route] of routes) {
    test(`${name}: renders without errors`, async ({ page }) => {
      await gotoDemo(page, route);
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
