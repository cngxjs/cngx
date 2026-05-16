import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

test.describe('ui/tabs/tab-commit-action', () => {
  test('optimistic-pessimistic commits: tabs render with bridge directives', async ({ page }) => {
    await gotoDemo(
      page,
      'ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives',
    );
    await expect(page.locator('cngx-tab-group')).toBeVisible();
  });
});
