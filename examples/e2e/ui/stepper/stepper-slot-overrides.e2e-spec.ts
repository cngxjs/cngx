import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

test.describe('ui/stepper/stepper-slot-overrides', () => {
  for (const { name, path } of routesIn('ui', 'stepper', 'stepper-slot-overrides')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
