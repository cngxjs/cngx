import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

const routes: ReadonlyArray<readonly [string, string]> = [
  ['mat-select-bindfield', 'forms/field/listbox-forms/material-mat-select-via-cngxbindfield'],
  ['reactive-forms-adapt', 'forms/field/listbox-forms/reactive-forms-adapted-via-adaptformcontrol'],
  ['signal-forms-multi', 'forms/field/listbox-forms/signal-forms-multi-select-min-2'],
  ['signal-forms-single', 'forms/field/listbox-forms/signal-forms-single-select'],
];

test.describe('forms/field/listbox-forms', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`listbox-forms-${name}.png`, { fullPage: true });
    });
  }
});
