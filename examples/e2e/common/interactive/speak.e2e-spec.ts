import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

interface SpeechLog {
  spoken: string[];
  cancels: number;
}

// Headless Chromium may ship no voice, so the real synth can settle back to
// idle at once. A recording fake makes the speak/cancel calls and the
// speaking() flip deterministic. The utterance never ends on its own.
async function stubSpeechSynthesis(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const log = { spoken: [] as string[], cancels: 0 };
    let current: SpeechSynthesisUtterance | null = null;
    const synth = {
      get speaking() {
        return current !== null;
      },
      pending: false,
      speak(utterance: SpeechSynthesisUtterance) {
        current = utterance;
        log.spoken.push(utterance.text);
        setTimeout(() => {
          utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
        });
      },
      cancel() {
        log.cancels++;
        current = null;
      },
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    Object.defineProperty(window, '__speechLog', { value: log });
  });
}

function speechLog(page: Page): Promise<SpeechLog> {
  return page.evaluate(() => (window as unknown as { __speechLog: SpeechLog }).__speechLog);
}

// Story: CngxSpeak wraps the SpeechSynthesis API. The host exposes
// `speaking()` and `toggle()`; the demo flips a button label between
// "Read passage" and "Stop reading". Audio output is not testable, the
// speak/cancel calls against a stubbed synth are.

test.describe('common/interactive/speak', () => {
  test('headless-read-aloud: speaks only on toggle and flips the pressed state', async ({ page }) => {
    await stubSpeechSynthesis(page);
    await gotoDemo(page, 'common/interactive/speak/headless-read-aloud');

    // Icon-only control: the accessible name is the aria-label, and it is the
    // only thing that communicates state to AT.
    const readBtn = page.getByRole('button', { name: 'Read passage' }).first();
    await expect(readBtn).toBeVisible();
    await expect(readBtn).toHaveAttribute('aria-pressed', 'false');
    expect((await speechLog(page)).spoken).toEqual([]);

    await readBtn.click();
    const stopBtn = page.getByRole('button', { name: 'Stop reading' });
    await expect(stopBtn).toHaveAttribute('aria-pressed', 'true');
    expect((await speechLog(page)).spoken).toHaveLength(1);

    await stopBtn.click();
    await expect(page.getByRole('button', { name: 'Stop reading' })).toHaveCount(0);
    expect(await speechLog(page)).toEqual(
      expect.objectContaining({ spoken: [expect.stringContaining('Welcome')], cancels: 1 }),
    );
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
