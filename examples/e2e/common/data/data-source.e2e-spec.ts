import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxDataSource - pull-based data feeding with manual + auto modes.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['paginate-manual', 'common/data/data-source/datasource-cngxpaginate-manual-pipeline'],
  ['signal-observable-bridge', 'common/data/data-source/signal-observable-bridge'],
];

test.describe('common/data/data-source', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
