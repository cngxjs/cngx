import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['custom-component-body', 'ui/feedback/toast/custom-component-body'],
  ['declarative', 'ui/feedback/toast/declarative-cngx-toast'],
  ['programmatic', 'ui/feedback/toast/programmatic-cngxtoaster'],
  ['state-bridge', 'ui/feedback/toast/state-bridge-cngxtoaston'],
  ['title-description', 'ui/feedback/toast/title-description'],
];

test.describe('ui/feedback/toast', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`toast-${name}.png`, { fullPage: true });
    });
  }
});
