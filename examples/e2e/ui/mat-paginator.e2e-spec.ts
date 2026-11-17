import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';

// Story: the [cngxMatPaginator] bridge adopts a <mat-paginator> in place and
// composes the CngxPaginate brain; a sibling list slices `ref.paginate.range()`.

test.describe('ui/mat-paginator', () => {
  test('instrumentation-bridge: [cngxMatPaginator] drives the sibling list; next advances the page', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/mat-paginator/instrumentation-bridge-cngxmatpaginator');

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
