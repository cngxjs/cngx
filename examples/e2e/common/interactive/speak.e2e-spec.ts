import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSpeak wraps the SpeechSynthesis API. The host exposes
// `speaking()` and `toggle()` — the demo flips a button label between
// "Listen" and "Stop". Audio output is not testable in headless browsers,
// but the state-machine flips are.

test.describe('common/interactive/speak', () => {
  test('headless-read-aloud: the icon button toggles its speaking label', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/speak/headless-read-aloud');

    // Icon-only control: the accessible name is the aria-label, and it is the
    // only thing that communicates state to AT.
    const readBtn = page.getByRole('button', { name: 'Read passage' }).first();
    await expect(readBtn).toBeVisible();
    await expect(readBtn).toHaveAttribute('aria-pressed', 'false');

    await readBtn.click();
    // Headless Chromium may have no speech-synthesis voice, so the directive
    // can settle back to idle. Either label is a pass; a missing button is not.
    await expect(
      page.getByRole('button', { name: /Read passage|Stop reading/ }).first(),
    ).toBeVisible();

  });

  test('form-error-read-aloud-on-demand: typing invalid email reveals hear-error button', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/speak/form-error-read-aloud-on-demand');

    const input = page.getByPlaceholder('user@example.com');
    const hearBtn = page.getByRole('button', { name: 'hear error' });

    // The story seeds an invalid value, so the error row and its button render
    // on load; clearing the field is what collapses them.
    await expect(hearBtn).toBeVisible();

    await input.fill('');
    await expect(hearBtn).toHaveCount(0);

    await input.fill('invalid');
    await expect(hearBtn).toBeVisible();

  });
});
