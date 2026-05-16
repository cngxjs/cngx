import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['full-control-toast', 'ui/feedback/async-container/cngx-async-container-full-control-toast'],
  ['one-line', 'ui/feedback/async-container/cngxasync-one-line'],
  ['custom-templates', 'ui/feedback/async-container/cngxasync-with-custom-templates'],
  ['composition-overlay', 'ui/feedback/async-container/composition-overlay-container-toast'],
  ['createasyncstate-mutation', 'ui/feedback/async-container/createasyncstate-mutation'],
  ['injectasyncstate-query', 'ui/feedback/async-container/injectasyncstate-reactive-query'],
];

test.describe('ui/feedback/async-container', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`async-container-${name}.png`, { fullPage: true });
    });
  }
});
