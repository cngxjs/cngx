import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: CngxSpeakButton — read-aloud button.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['material-integration', 'ui/speak/speak-button/material-integration-theme-scss-mat-icon-button'],
  ['styled-speaker-icon', 'ui/speak/speak-button/styled-speaker-icon'],
  ['theming-css-vars', 'ui/speak/speak-button/theming-css-custom-properties'],
];

test.describe('ui/speak/speak-button', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page).toHaveScreenshot(`speak-button-${name}.png`, { fullPage: true });
    });
  }
});
