import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxFilterChips is a bridge between a multi-select chip strip
// and a parent CngxFilter. Toggling chips re-runs the filter predicate.

test.describe('common/data/filter-chips', () => {
  test('multi-role: toggling chips filters the list', async ({ page }) => {
    await gotoDemo(page, 'common/data/filter-chips/multi-role-filter-wired-to-a-list');

    const list = page.locator('ul').first();
    // Initially no filter — all 5 items visible.
    const items = list.locator('li');
    await expect(items).toHaveCount(5);

    // Select "Urgent" chip — list narrows.
    const urgent = page.getByRole('option', { name: 'Urgent' });
    await urgent.click();
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('Urgent');

    // Add Review — count grows to 2.
    await page.getByRole('option', { name: 'Review' }).click();
    await expect(items).toHaveCount(2);

  });

  test('custom-chip-decoration: renders the chip strip with consumer decoration', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/filter-chips/custom-chip-decoration-via-cngxfilterchip');

    const chips = page.getByRole('option');
    expect(await chips.count()).toBeGreaterThan(0);

  });
});
