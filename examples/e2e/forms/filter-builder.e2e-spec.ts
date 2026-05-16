import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxFilterBuilder composes filter rows and AND/OR groups into a
// structured filter. Each story exercises a different surface.

test.describe('forms/filter-builder', () => {
  test('basic two-way: JSON inspection updates as user edits', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/basic-two-way-binding-json-inspection');
  });

  test('async-state: loading/error/content branches render', async ({ page }) => {
    await gotoDemo(
      page,
      'forms/filter-builder/filter-builder-async-state/loading-error-content-branches-via-cngx-async-container',
    );
  });

  test('filter-builder-json: JSON builder renders', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/filter-builder-json/builder-json');
  });

  test('filter-row-standalone: single row renders', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/filter-row-standalone/single-row-with-value');
  });

  test('seeded tree: AND/OR composition renders', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/seeded-tree-and-or-composition');
  });
});
