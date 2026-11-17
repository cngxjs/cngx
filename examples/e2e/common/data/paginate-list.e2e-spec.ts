import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPaginate drives any list-like consumer via `pg.range()`; native
// Previous / Next buttons call `pg.previous()` / `pg.next()`.

test.describe('common/data/paginate-list', () => {
  test('paginated-list: page size 5 means first page shows 5 items, status reads "1–5 of N"', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/paginate-list/paginated-list-cngxpaginate');

    const items = page.locator('.demo-list-flush li');
    await expect(items).toHaveCount(5);

    const status = page.locator('.status-badge').filter({ hasText: /of \d+ people/ });
    await expect(status).toContainText(/^\s*1[–-]5 of \d+ people\s*$/);

    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(status).toContainText(/6[–-]10 of \d+ people/);

  });

  test('uncontrolled-mode: code-block story renders without error', async ({ page }) => {
    await gotoDemo(page, 'common/data/paginate-list/uncontrolled-mode-zero-class-boilerplate');
    await expect(page.locator('details.cngx-ex-code').first()).toBeVisible();
  });
});
