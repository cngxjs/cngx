import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPaginate drives any list-like consumer via `pg.range()`.
// CngxMatPaginator provides the Material paginator UI.

test.describe('common/data/paginate-list', () => {
  test('paginated-list: page size 5 means first page shows 5 items, status reads "1–5 of N"', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/paginate-list/paginated-list-cngxpaginate-cngxmatpaginator');

    const items = page.locator('ul li');
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
    await expect(page.locator('pre.code-block')).toBeVisible();
  });
});
