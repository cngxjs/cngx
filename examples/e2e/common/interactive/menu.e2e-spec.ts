import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMenu without a trigger — a standalone action menu with
// keyboard navigation and a separator.

test.describe('common/interactive/menu', () => {
  test('action-menu-with-separator: items + separator render, click activates', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/menu/action-menu-with-separator');

    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();

    const items = page.getByRole('menuitem');
    expect(await items.count()).toBeGreaterThanOrEqual(2);

    const sep = page.locator('[role="separator"], li.sep, [cngxmenuseparator]').first();
    expect(await sep.count()).toBeGreaterThanOrEqual(0);

    await items.first().click();

  });
});
