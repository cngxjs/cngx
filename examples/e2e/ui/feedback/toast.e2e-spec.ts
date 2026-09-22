import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

test.describe('ui/feedback/toast', () => {
  for (const { name, path } of routesIn('ui', 'feedback', 'toast')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
