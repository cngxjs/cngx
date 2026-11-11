import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: common/layout/sidebar/collapsible-rail, an icon rail whose labels go
// sr-only on the rail and come back on the hover peek.

test.describe('common/layout/sidebar', () => {
  test('collapsible-rail: an icon-only rail row is as tall as the peeked row', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'common/layout/sidebar/collapsible-rail');
    const sidebar = page.locator('#rail-sidebar');
    const row = sidebar.locator('a.demo-nav__link--icon').first();
    await expect(sidebar).toHaveAttribute('data-sidebar-state', 'rail');
    const rail = (await row.boundingBox())?.height ?? 0;

    await row.hover();
    await expect(sidebar).toHaveAttribute('data-sidebar-state', 'peek');
    const peek = (await row.boundingBox())?.height ?? 0;

    expect(rail).toBeGreaterThan(0);
    expect(Math.abs(rail - peek)).toBeLessThanOrEqual(0.5);
  });
});
