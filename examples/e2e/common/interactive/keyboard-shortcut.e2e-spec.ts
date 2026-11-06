import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxKeyboardShortcut binds key combos on the hotkey registry. In a
// text field only modifier combos (and Escape / F-keys) fire, so Ctrl+K fires
// while typing and a bare / does not. Self scope only fires when focus is
// inside the host.

// `mod` resolves per platform: Cmd on a macOS runner, Ctrl on the Linux CI.
const MOD_K = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';

test.describe('common/interactive/keyboard-shortcut', () => {
  test('global: Ctrl+K fires everywhere, / only outside the text field', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/gestures/keyboard-shortcut/global-shortcut');

    const counter = page
      .locator('.event-row')
      .filter({ has: page.getByText('Global triggers', { exact: true }) })
      .locator('.event-value');
    const last = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last shortcut', { exact: true }) })
      .locator('.event-value');
    await expect(counter).toHaveText('0');

    await expect(page.getByRole('button', { name: /Run command/ })).toHaveAttribute(
      'aria-keyshortcuts',
      MOD_K,
    );
    await expect(page.getByRole('button', { name: /Focus search/ })).toHaveAttribute(
      'aria-keyshortcuts',
      '/',
    );

    await page.keyboard.press('ControlOrMeta+k');
    await expect(counter).toHaveText('1');
    await page.keyboard.press('/');
    await expect(counter).toHaveText('2');
    await expect(last).toHaveText('/');

    const input = page.getByRole('textbox');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+k');
    await expect(counter).toHaveText('3');
    await expect(last).toHaveText('Ctrl+K / Cmd+K');

    await page.keyboard.press('/');
    await expect(counter).toHaveText('3');
    await expect(input).toHaveValue('/');
  });

  test('self-scoped: Escape fires only after focusing the dashed box', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/gestures/keyboard-shortcut/self-scoped-shortcut');

    const counter = page
      .locator('.event-row')
      .filter({ has: page.getByText('Escape triggers', { exact: true }) })
      .locator('.event-value');
    await expect(counter).toHaveText('0');

    // Press Escape with focus on the body — counter must stay at 0.
    await page.keyboard.press('Escape');
    await expect(counter).toHaveText('0');

    // The host is the tabindex=0 dashed box. Click focuses it.
    const scopedHost = page.getByRole('group', { name: 'Press Escape to dismiss' });
    await expect(scopedHost).toHaveAttribute('aria-keyshortcuts', 'Escape');
    await scopedHost.click();
    await page.keyboard.press('Escape');
    await expect(counter).toHaveText('1');

  });
});
