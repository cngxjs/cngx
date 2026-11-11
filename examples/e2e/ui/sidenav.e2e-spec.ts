import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: CngxSidenav (Material-themed) renders a navigation sidebar.

test.describe('ui/sidenav', () => {
  for (const { name, path } of routesUnder('ui', 'sidenav')) {
    test(`${name}: renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }

  test('the collapsed rail header shows the brand mark and keeps the name in the AX tree', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/sidenav/config-hover-dwell');
    const nav = page.locator('cngx-sidenav', { hasText: 'Config' }).first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    const header = nav.locator('cngx-sidenav-header');
    const mark = header.locator('.demo-sidenav__brand-mark');
    const name = header.locator('.demo-sidenav__brand-name');

    await expect(mark).toBeVisible();
    await expect(mark).toHaveText('C');
    // The name leaves the flow with the sr-only clip, so it paints nothing.
    const box = await name.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(1);
    expect(box?.height ?? 0).toBeLessThanOrEqual(1);
    // The mark is aria-hidden; the clipped name still reaches the AX tree.
    await expect(header).toMatchAriaSnapshot('- text: Config');
  });

  test('full-navigation-sidebar: a rail row is as tall as the expanded row', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await gotoDemo(page, 'ui/sidenav/full-navigation-sidebar');
    const nav = page.locator('cngx-sidenav').first();
    const row = nav.locator('a.cngx-nav-link').first();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'expanded');
    const expanded = (await row.boundingBox())?.height ?? 0;

    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.mouse.move(1500, 850);
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');
    const rail = (await row.boundingBox())?.height ?? 0;

    expect(expanded).toBeGreaterThan(0);
    expect(Math.abs(rail - expanded)).toBeLessThanOrEqual(0.5);
  });
});
