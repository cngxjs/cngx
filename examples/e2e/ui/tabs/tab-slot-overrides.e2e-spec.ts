import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['busy-spinner', 'ui/tabs/tab-slot-overrides/custom-busy-spinner-via-code-cngxtabbusyspinner-code'],
  ['error-badge', 'ui/tabs/tab-slot-overrides/custom-error-badge-via-code-cngxtaberrorbadge-code'],
  ['rejection-decoration', 'ui/tabs/tab-slot-overrides/rejection-decoration-via-code-cngxtabrejectionicon-code'],
];

test.describe('ui/tabs/tab-slot-overrides', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
