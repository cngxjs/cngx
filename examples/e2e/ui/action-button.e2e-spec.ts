import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: CngxAsyncButton — wraps a button with pending/error states.

test.describe('ui/action-button/async-button', () => {
  for (const { name, path } of routesUnder('ui', 'action-button')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
