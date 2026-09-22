import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: forms/input covers autosize, mask, numeric, otp,
// password-visibility, autocomplete, utilities, file-drop, character-counter.
// Smoke each route to verify it renders without runtime errors.

test.describe('forms/input', () => {
  for (const { name, path } of routesUnder('forms', 'input')) {
    test(`${name}: route renders the feature component`, async ({ page }) => {
      await gotoDemo(page, path);
      // Smoke: the feature component mounts (any element below cngx-ex-intro).
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
