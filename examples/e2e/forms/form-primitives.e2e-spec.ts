import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';
import { routesIn } from '../_routes';

test.describe('forms/field/form-primitives', () => {
  for (const { name, path } of routesIn('forms', 'field', 'form-primitives')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
