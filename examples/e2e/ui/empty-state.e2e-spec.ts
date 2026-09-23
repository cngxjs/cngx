import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';
import { routesIn } from '../_routes';

// Story: CngxEmptyState — placeholder for empty data with icon/actions
// slots. 5 contexts demoed (default, card-grid, list, table, custom).

test.describe('ui/empty-state', () => {
  for (const { name, path } of routesIn('ui', 'empty-state')) {
    test(`${name}: renders without errors`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
