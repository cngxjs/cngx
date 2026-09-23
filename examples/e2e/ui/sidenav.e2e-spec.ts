import { expect, test } from '@playwright/test';
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
});
