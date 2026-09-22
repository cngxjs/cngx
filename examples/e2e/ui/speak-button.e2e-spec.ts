import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';
import { routesIn } from '../_routes';

// Story: CngxSpeakButton — read-aloud button.

test.describe('ui/speak/speak-button', () => {
  for (const { name, path } of routesIn('ui', 'speak', 'speak-button')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
