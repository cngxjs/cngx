import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxKeyboardShortcut binds key combos as signals. Global scope
// filters input-elements (so typing in an <input> does not fire the
// shortcut). Self scope only fires when focus is inside the host.

test.describe('common/interactive/keyboard-shortcut', () => {
  test('global: Ctrl+K bumps the counter, but only when focus is outside input', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/keyboard-shortcut/global-shortcut');

    const counter = page
      .locator('.event-row')
      .filter({ has: page.getByText('Global triggers', { exact: true }) })
      .locator('.event-value');
    await expect(counter).toHaveText('0');

    // Press Ctrl+K with focus on the body — counter must climb.
    await page.keyboard.press('Control+k');
    await expect(counter).toHaveText('1');

    // Focus the input — same shortcut must be filtered out.
    const input = page.getByPlaceholder("Type here — Ctrl+K won't fire");
    await input.focus();
    await page.keyboard.press('Control+k');
    await expect(counter).toHaveText('1');

    await expect(page).toHaveScreenshot('keyboard-shortcut-global.png', { fullPage: true });
  });

  test('self-scoped: Escape fires only after focusing the dashed box', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/keyboard-shortcut/self-scoped-shortcut');

    const counter = page
      .locator('.event-row')
      .filter({ has: page.getByText('Escape triggers', { exact: true }) })
      .locator('.event-value');
    await expect(counter).toHaveText('0');

    // Press Escape with focus on the body — counter must stay at 0.
    await page.keyboard.press('Escape');
    await expect(counter).toHaveText('0');

    // The host is the tabindex=0 dashed box. Click focuses it.
    const scopedHost = page.locator('div[tabindex="0"]').filter({ hasText: /Click me/ });
    await scopedHost.click();
    await page.keyboard.press('Escape');
    await expect(counter).toHaveText('1');

    await expect(page).toHaveScreenshot('keyboard-shortcut-self.png', { fullPage: true });
  });
});
