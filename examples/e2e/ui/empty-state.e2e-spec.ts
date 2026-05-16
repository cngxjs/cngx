import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxEmptyState — placeholder for empty data with icon/actions
// slots. 5 contexts demoed (default, card-grid, list, table, custom).

const routes: ReadonlyArray<readonly [string, string]> = [
  ['default', 'ui/empty-state/default-no-icon-projected'],
  ['card-grid', 'ui/empty-state/inside-a-card-grid'],
  ['list', 'ui/empty-state/inside-a-list'],
  ['table', 'ui/empty-state/inside-a-table'],
  ['custom-icon', 'ui/empty-state/with-custom-icon-actions'],
];

test.describe('ui/empty-state', () => {
  for (const [name, route] of routes) {
    test(`${name}: renders without errors`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
