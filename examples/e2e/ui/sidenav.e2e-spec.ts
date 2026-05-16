import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxSidenav (Material-themed) renders a navigation sidebar.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['dual-sidebar', 'ui/sidenav/dual-sidebar-master-detail'],
  ['full-navigation', 'ui/sidenav/full-navigation-sidebar'],
  ['material-theming', 'ui/sidenav/material-theming-light-vs-dark'],
];

test.describe('ui/sidenav', () => {
  for (const [name, route] of routes) {
    test(`${name}: renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`sidenav-${name}.png`, { fullPage: true });
    });
  }
});
