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

/** Read the shared engine's status() from the page. */
function engineStatus(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => {
    const engine = (window as unknown as Record<string, { status(): string }>)['__cngxAudioEngine'];
    return engine ? engine.status() : null;
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

test.describe('CngxAudioStatus status-bridge', () => {
  const STATUS_ROUTE = '/#/common/audio/status-bridge/async-click';

  test('plays the success earcon after an async action resolves', async ({ page }) => {
    await page.goto(STATUS_ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);

    // The click arms the autoplay gate and drives the state idle -> pending -> success.
    await page.getByRole('button', { name: 'Upload' }).click();

    // pending fires 'tap', then the resolved action fires 'success'.
    await expect.poll(() => lastPlayed(page)).toBe('success');
  });

  test('plays the error earcon when the action rejects', async ({ page }) => {
    await page.goto(STATUS_ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);

    await page.getByLabel('Fail next upload').check();
    await page.getByRole('button', { name: 'Upload' }).click();

    await expect.poll(() => lastPlayed(page)).toBe('error');
  });
});

test.describe('CngxAudioZone enter/leave', () => {
  const ZONE_ROUTE = '/#/common/audio/zone/enter-leave';

  test('plays the enter earcon on pointer enter once armed', async ({ page }) => {
    await page.goto(ZONE_ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);

    await page.getByRole('button', { name: 'Enable sound' }).click();
    await page.getByRole('button', { name: 'Hover or focus this zone' }).hover();

    await expect.poll(() => lastPlayed(page)).toBe('notification');
  });
});

test.describe('CngxAudioPitch sonification', () => {
  const PITCH_ROUTE = '/#/common/audio/pitch/slider';

  test('spins up the audio context when the slider is swept', async ({ page }) => {
    await page.goto(PITCH_ROUTE);
    await page.waitForFunction(() => '__cngxAudioEngine' in window);

    expect(await engineStatus(page)).toBe('idle');

    // Focus + arrow keys are a real keydown gesture: arms autoplay and the
    // pitch directive plays tones (engine.tone() does not touch lastPlayed, so
    // the observable signal here is the context status running).
    const slider = page.getByRole('slider', { name: 'Level' });
    await slider.focus();
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');

    await expect.poll(() => engineStatus(page)).toBe('running');
  });
});
