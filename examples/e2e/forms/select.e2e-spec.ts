import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: forms/select family — single/multi/combobox/
// typeahead/reorderable/select-shell variants, slots, async, RF/SF, etc.
// Smoke each route: page renders header without runtime errors.

test.describe('forms/select', () => {
  for (const { name, path } of routesUnder('forms', 'select')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
