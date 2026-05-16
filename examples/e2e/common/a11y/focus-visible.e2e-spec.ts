import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxFocusVisible only flips its `focusVisible` signal to true
// when focus arrives via keyboard. Mouse focus leaves it false. The
// stateful directive surfaces this for both CSS and TS consumers.

test.describe('common/a11y/focus-visible', () => {
  test('keyboard-vs-pointer: tab shows the ring, mouse click does not', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/focus-visible/keyboard-vs-pointer');

    const buttonA = page.getByRole('button', { name: /Button A/ });
    const buttonB = page.getByRole('button', { name: /Button B/ });

    // Mouse click — focus arrives but should NOT be treated as visible.
    await buttonA.click();
    const aState = page
      .locator('.event-row')
      .filter({ has: page.getByText('Button A focusVisible', { exact: true }) })
      .locator('.event-value');
    await expect(aState).toHaveText('false');

    // Tab moves focus from A → B via keyboard — this counts as visible.
    await page.keyboard.press('Tab');
    const bState = page
      .locator('.event-row')
      .filter({ has: page.getByText('Button B focusVisible', { exact: true }) })
      .locator('.event-value');
    await expect(bState).toHaveText('true');
    await expect(buttonB).toBeFocused();

    await expect(page).toHaveScreenshot('keyboard-tabbed.png', { fullPage: true });
  });

  test('form-fields: keyboard focus paints the ring on inputs', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/focus-visible/form-fields-custom-focus-ring');

    const nameInput = page.getByPlaceholder('Jane Doe');
    await nameInput.click();
    const nameState = page
      .locator('.event-row')
      .filter({ has: page.getByText('Name field', { exact: true }) })
      .locator('.event-value');
    // Pointer click — not focus-visible.
    await expect(nameState).toHaveText('no keyboard focus');

    // Tab to the email field via keyboard.
    await page.keyboard.press('Tab');
    const emailState = page
      .locator('.event-row')
      .filter({ has: page.getByText('Email field', { exact: true }) })
      .locator('.event-value');
    await expect(emailState).toHaveText('keyboard focus');

    await expect(page).toHaveScreenshot('form-email-keyboard-focus.png', { fullPage: true });
  });
});
