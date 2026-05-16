import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxAlertStack groups multiple alerts with stacking semantics.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['basic-stack', 'ui/feedback/alert-stack/basic-stack'],
  ['dialog', 'ui/feedback/alert-stack/dialog-use-case'],
  ['overflow', 'ui/feedback/alert-stack/overflow-collapse'],
];

test.describe('ui/feedback/alert-stack', () => {
  for (const [name, route] of routes) {
    test(`${name}: renders the alert stack`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`alert-stack-${name}.png`, { fullPage: true });
    });
  }
});
