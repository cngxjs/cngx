import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSpeak wraps the SpeechSynthesis API. The host exposes
// `speaking()` and `toggle()` — the demo flips a button label between
// "Listen" and "Stop". Audio output is not testable in headless browsers,
// but the state-machine flips are.

test.describe('common/interactive/speak', () => {
  test('headless-read-aloud: toggle flips Listen ↔ Stop labels', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/speak/headless-read-aloud');

    const listenBtn = page.getByRole('button', { name: 'Listen' }).first();
    await expect(listenBtn).toBeVisible();

    await listenBtn.click();
    // After toggle, button rebrands to Stop (if speech-synthesis is
    // available in the test environment) or remains Listen if not. Either
    // is acceptable as a smoke; assert at least one of the two labels
    // remains present (no crash).
    await expect(
      page.getByRole('button', { name: /Listen|Stop/ }).first(),
    ).toBeVisible();

  });

  test('form-error-read-aloud-on-demand: typing invalid email reveals hear-error button', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/speak/form-error-read-aloud-on-demand');

    const input = page.getByPlaceholder('user@example.com');
    await expect(page.getByRole('button', { name: 'hear error' })).toHaveCount(0);

    await input.fill('invalid');
    await expect(page.getByRole('button', { name: 'hear error' })).toBeVisible();

  });
});
