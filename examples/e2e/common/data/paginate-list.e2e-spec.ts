import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPaginate drives any list-like consumer via `pg.range()`.
// The [cngxMatPaginator] bridge (CngxMatPaginator) provides the Material
// paginator UI by adopting a <mat-paginator> in place.

test.describe('common/data/paginate-list', () => {
  test('paginated-list: page size 5 means first page shows 5 items, status reads "1–5 of N"', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/paginate-list/paginated-list-cngxpaginate-cngxmatpaginator');

    const items = page.locator('.demo-list-flush li');
    await expect(items).toHaveCount(5);

    const status = page.locator('.status-badge').filter({ hasText: /of \d+ people/ });
    await expect(status).toContainText(/^\s*1[–-]5 of \d+ people\s*$/);

    // Advance via the Material paginator's next-page button.
    const next = page.getByRole('button', { name: /next page/i });
    await next.click();
    await expect(status).toContainText(/6[–-]10 of \d+ people/);

  });

  test('uncontrolled-mode: code-block story renders without error', async ({ page }) => {
    await gotoDemo(page, 'common/data/paginate-list/uncontrolled-mode-zero-class-boilerplate');
    await expect(page.locator('details.cngx-ex-code').first()).toBeVisible();
  });

  test('instrumentation-bridge: [cngxMatPaginator] drives the sibling list; next advances the page', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/paginate-list/instrumentation-bridge-cngxmatpaginator');

    // Default page size is 10, so the first page shows 10 of the 16 items.
    const items = page.locator('.demo-list-flush li');
    await expect(items).toHaveCount(10);

    const status = page.locator('.status-badge').filter({ hasText: /of \d+ people/ });
    await expect(status).toContainText(/^\s*1[–-]10 of 16 people\s*$/);

    // The page-size selector reflects the bound [pageSizeOptions] active value.
    await expect(page.locator('.mat-mdc-paginator-page-size')).toContainText('10');

    // Advance via the adopted Material paginator's next-page button.
    const next = page.getByRole('button', { name: /next page/i });
    await next.click();
    await expect(status).toContainText(/11[–-]16 of 16 people/);
  });
});
