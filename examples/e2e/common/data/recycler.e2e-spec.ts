import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

test.describe('common/data/recycler', () => {
  for (const { name, path } of routesIn('common', 'data', 'recycler')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
