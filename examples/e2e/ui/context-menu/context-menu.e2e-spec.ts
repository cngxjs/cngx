import { expect, test } from '../../_test';
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

  test('static-items: Tab out of the keyboard-opened menu closes it', async ({ page }) => {
    await gotoDemo(page, 'ui/context-menu/basic/static-items');
    const zone = page.locator('.demo-ctx-zone').first();
    const menu = page.locator('[role="menu"]');

    await zone.focus();
    await page.keyboard.press('Shift+F10');
    await expect(menu).toBeVisible();
    await expect(menu).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(menu).toBeHidden();
    await expect(zone).toHaveAttribute('aria-expanded', 'false');
    await expect(zone).not.toBeFocused();
  });

  test('nested-export-menu: arrow keys move the submenu highlight, not the root', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/context-menu/submenu/nested-export-menu');
    const zone = page.locator('.demo-ctx-zone').first();
    const root = page.getByRole('menu', { name: 'Document actions' });
    const sub = page.getByRole('menu', { name: 'Export format' });

    await zone.focus();
    await page.keyboard.press('Shift+F10');
    await expect(root).toBeVisible();

    const renameId = await root.getByRole('menuitem', { name: 'Rename' }).getAttribute('id');
    const exportId = await root.getByRole('menuitem', { name: 'Export as' }).getAttribute('id');
    expect(exportId).toBeTruthy();
    await expect(root).toHaveAttribute('aria-activedescendant', renameId ?? '');

    // Rename -> Duplicate -> Export as (the divider is skipped).
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(root).toHaveAttribute('aria-activedescendant', exportId ?? '');

    await page.keyboard.press('ArrowRight');
    await expect(sub).toBeVisible();

    const subItems = sub.getByRole('menuitem');
    const [pdfId, csvId, pngId] = await Promise.all(
      [0, 1, 2].map((i) => subItems.nth(i).getAttribute('id')),
    );
    await expect(sub).toHaveAttribute('aria-activedescendant', pdfId ?? '');
    const rootActive = await root.getAttribute('aria-activedescendant');

    await page.keyboard.press('ArrowDown');
    await expect(sub).toHaveAttribute('aria-activedescendant', csvId ?? '');
    await expect(root).toHaveAttribute('aria-activedescendant', rootActive ?? '');

    await page.keyboard.press('End');
    await expect(sub).toHaveAttribute('aria-activedescendant', pngId ?? '');
    await expect(root).toHaveAttribute('aria-activedescendant', rootActive ?? '');

    await page.keyboard.press('ArrowLeft');
    await expect(sub).toBeHidden();
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute('aria-activedescendant', exportId ?? '');
  });
});
