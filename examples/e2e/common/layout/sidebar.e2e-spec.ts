import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: common/layout/sidebar/inset-app-sidebar, nav rows under
// [cngxNavRailed] that crop to their icon box on the rail.

test.describe('common/layout/sidebar', () => {
  test('inset-app-sidebar: a railed nav row is as tall as the expanded row', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'common/layout/sidebar/inset-app-sidebar');
    const sidebar = page.locator('#inset-sidebar');
    const row = sidebar.locator('.cngx-nav-group').first();
    await expect(sidebar).toHaveAttribute('data-sidebar-state', 'expanded');
    const expanded = (await row.boundingBox())?.height ?? 0;

    await page.getByRole('button', { name: 'Main sidebar' }).click();
    await expect(sidebar).toHaveAttribute('data-sidebar-state', 'rail');
    await expect(sidebar).toHaveAttribute('data-nav-railed', 'true');
    const rail = (await row.boundingBox())?.height ?? 0;

    expect(expanded).toBeGreaterThan(0);
    expect(Math.abs(rail - expanded)).toBeLessThanOrEqual(0.5);
  });
});
