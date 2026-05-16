import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['async-action', 'ui/feedback/banner/async-action'],
  ['dedup-update', 'ui/feedback/banner/dedup-update'],
  ['system-banners', 'ui/feedback/banner/system-banners'],
];

test.describe('ui/feedback/banner', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`banner-${name}.png`, { fullPage: true });
    });
  }
});
