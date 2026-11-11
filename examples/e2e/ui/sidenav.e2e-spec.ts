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
});
