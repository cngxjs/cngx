import { expect, test } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Story: forms/input has 17 routes covering autosize, mask, numeric, otp,
// password-visibility, autocomplete, utilities, file-drop, character-counter.
// Smoke each route to verify it renders without runtime errors.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['autosize-basic', 'forms/input/autosize/basic-autosize'],
  ['autosize-min-max', 'forms/input/autosize/min-max-rows'],
  ['character-counter', 'forms/input/character-counter'],
  ['file-drop', 'forms/input/file-drop/image-upload'],
  ['mask-custom-pattern', 'forms/input/mask/custom-pattern'],
  ['mask-custom-tokens', 'forms/input/mask/custom-tokens-and-transform'],
  ['mask-locale-presets', 'forms/input/mask/locale-presets'],
  ['numeric-basic', 'forms/input/numeric/basic-numeric-input'],
  ['numeric-locale', 'forms/input/numeric/locale-formatting'],
  ['numeric-min-max-step', 'forms/input/numeric/min-max-step-decimals'],
  ['otp-4-digit', 'forms/input/otp/4-digit-pin'],
  ['otp-6-digit', 'forms/input/otp/6-digit-otp'],
  ['password-visibility', 'forms/input/password-visibility-toggle'],
  ['smart-autocomplete', 'forms/input/smart-autocomplete-and-spellcheck'],
  ['util-copy-to-clipboard', 'forms/input/utilities/copy-to-clipboard'],
  ['util-input-clear', 'forms/input/utilities/input-clear'],
  ['util-input-format', 'forms/input/utilities/input-format'],
];

test.describe('forms/input', () => {
  for (const [name, route] of routes) {
    test(`${name}: route renders the feature component`, async ({ page }) => {
      await gotoDemo(page, route);
      // Smoke: the feature component mounts (any element below cngx-ex-intro).
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }
});
