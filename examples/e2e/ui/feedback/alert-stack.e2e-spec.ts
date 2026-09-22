import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

// Story: CngxAlertStack groups multiple alerts with stacking semantics.

test.describe('ui/feedback/alert-stack', () => {
  for (const { name, path } of routesIn('ui', 'feedback', 'alert-stack')) {
    test(`${name}: renders the alert stack`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
