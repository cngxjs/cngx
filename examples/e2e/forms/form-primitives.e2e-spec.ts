import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['coming-in-follow-up', 'forms/field/form-primitives/coming-in-a-follow-up'],
  ['reactive-forms', 'forms/field/form-primitives/reactive-forms-same-atom-just-bind-formcontrol'],
  ['signal-forms', 'forms/field/form-primitives/signal-forms-drop-the-atom-into-cngx-form-field'],
];

test.describe('forms/field/form-primitives', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`form-primitives-${name}.png`, { fullPage: true });
    });
  }
});
