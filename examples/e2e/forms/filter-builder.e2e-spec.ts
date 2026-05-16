import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxFilterBuilder composes filter rows and AND/OR groups into a
// structured filter. Each story exercises a different surface.

test.describe('forms/filter-builder', () => {
  test('basic two-way: JSON inspection updates as user edits', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/basic-two-way-binding-json-inspection');
    await expect(page).toHaveScreenshot('filter-builder-basic.png', { fullPage: true });
  });

  test('async-state: loading/error/content branches render', async ({ page }) => {
    await gotoDemo(
      page,
      'forms/filter-builder/filter-builder-async-state/loading-error-content-branches-via-cngx-async-container',
    );
    await expect(page).toHaveScreenshot('filter-builder-async.png', { fullPage: true });
  });

  test('filter-builder-json: JSON builder renders', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/filter-builder-json/builder-json');
    await expect(page).toHaveScreenshot('filter-builder-json.png', { fullPage: true });
  });

  test('filter-row-standalone: single row renders', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/filter-row-standalone/single-row-with-value');
    await expect(page).toHaveScreenshot('filter-row.png', { fullPage: true });
  });

  test('seeded tree: AND/OR composition renders', async ({ page }) => {
    await gotoDemo(page, 'forms/filter-builder/seeded-tree-and-or-composition');
    await expect(page).toHaveScreenshot('filter-builder-seeded.png', { fullPage: true });
  });
});
