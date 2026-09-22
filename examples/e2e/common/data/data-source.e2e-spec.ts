import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxDataSource - pull-based data feeding with manual + auto modes.

test.describe('common/data/data-source', () => {
  for (const { name, path } of routesIn('common', 'data', 'data-source')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
