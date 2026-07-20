import { expect, test } from '@playwright/test';

// Audio is unsniffable in a headless browser, so every assertion routes through
// the engine's lastPlayed() signal, exposed on window.__cngxAudioEngine by the
// custom-earcons story under a demo guard.
const ROUTE = '/#/common/audio/event-mode/custom-earcons';

/** Read the shared engine's lastPlayed() from the page. */
function lastPlayed(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => {
    const engine = (window as unknown as Record<string, { lastPlayed(): string | null }>)[
      '__cngxAudioEngine'
    ];
    return engine ? engine.lastPlayed() : null;
  });
}

test.describe('CngxAudio event-mode', () => {
  test('arms the autoplay gate on the first click and plays the earcon', async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);

    expect(await lastPlayed(page)).toBeNull();

    await page.getByRole('button', { name: 'Send', exact: true }).click();

    expect(await lastPlayed(page)).toBe('send');
  });

  test('logs no AudioContext autoplay warnings', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' || msg.type() === 'error') {
        warnings.push(msg.text());
      }
    });

    await page.goto(ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);
    await page.getByRole('button', { name: 'Send', exact: true }).click();

    expect(warnings.filter((w) => /AudioContext/i.test(w))).toHaveLength(0);
  });

  test('an [audioDisabled] instance never plays, even after arming', async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);

    // Clicking the disabled instance arms the gate (it is a real pointer gesture)
    // but the directive short-circuits before play, so lastPlayed stays null.
    await page.getByRole('button', { name: 'Send (muted instance)' }).click();

    expect(await lastPlayed(page)).toBeNull();
  });
});
