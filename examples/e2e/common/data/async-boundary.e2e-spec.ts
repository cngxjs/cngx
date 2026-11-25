import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

function boundary(page: Page) {
  return page.locator('.cngx-ex-artifact').locator('div').first();
}

function items(page: Page) {
  return page.locator('.cngx-ex-artifact li.demo-card-tile');
}

function skeleton(page: Page) {
  return page.locator('.cngx-ex-artifact .demo-skeleton-bar');
}

test.describe('common/data/async-boundary', () => {
  test('any-loading-shows-skeleton: one loading source holds the skeleton until it settles', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/async-boundary/any-loading-shows-skeleton');
    await expect(skeleton(page)).toHaveCount(3);
    await expect(items(page)).toHaveCount(0);
    await expect(boundary(page)).toHaveAttribute('aria-busy', 'true');

    await page.getByRole('button', { name: 'Resolve the loading source' }).click();
    await expect(items(page)).toHaveText([
      'User: Ada Lovelace',
      'Permissions: read,write,deploy',
      'Feature flags: beta-dashboard',
    ]);
    await expect(skeleton(page)).toHaveCount(0);
    await expect(boundary(page)).not.toHaveAttribute('aria-busy', 'true');

    await page.getByRole('button', { name: 'Refresh the source (content stays)' }).click();
    await expect(boundary(page)).toHaveAttribute('aria-busy', 'true');
    await expect(items(page)).toHaveCount(3);
    await expect(skeleton(page)).toHaveCount(0);
  });

  test('all-settled-renders-content: content when every source settled, busy on reload', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/data/async-boundary/all-settled-renders-content');
    await expect(items(page)).toHaveCount(3);
    await expect(skeleton(page)).toHaveCount(0);
    await expect(boundary(page)).not.toHaveAttribute('aria-busy', 'true');

    await page.getByRole('button', { name: 'Reload all (1.2s)' }).click();
    await expect(boundary(page)).toHaveAttribute('aria-busy', 'true');
    await expect(items(page)).toHaveCount(3);
    await expect(boundary(page)).not.toHaveAttribute('aria-busy', 'true', { timeout: 4000 });
    await expect(items(page)).toHaveCount(3);
  });
});
