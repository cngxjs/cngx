import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxAsyncButton — wraps a button with pending/error states.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['random-outcome', 'ui/action-button/async-button/random-outcome'],
  ['string-labels', 'ui/action-button/async-button/string-labels'],
  ['template-slots', 'ui/action-button/async-button/template-slots'],
];

test.describe('ui/action-button/async-button', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
