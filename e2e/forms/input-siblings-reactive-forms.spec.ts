import { expect, test, type Locator, type Page } from '@playwright/test';

// The masked and formatted inputs place the caret in a frame after focus; let it land before editing.
async function focusAndSettle(page: Page, input: Locator): Promise<void> {
  await input.focus();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
}

test.describe('mask siblings reactive forms stories', () => {
  test('numeric input carries a number into the control and loads clean', async ({ page }) => {
    await page.goto('/#/forms/input/numeric/reactive-forms');
    const input = page.getByRole('spinbutton', { name: 'Amount' });
    const value = page.getByTestId('amount-value');
    const dirty = page.getByTestId('amount-dirty');

    await expect(input).toBeVisible();
    await expect(value).toHaveText('Control value: null');
    await expect(dirty).toHaveText('Dirty: false');

    await focusAndSettle(page, input);
    await input.pressSequentially('1234,5');
    await input.press('Tab');

    await expect(input).toHaveValue('1.234,50');
    await expect(value).toHaveText('Control value: 1234.5');
    await expect(dirty).toHaveText('Dirty: true');
  });

  test('formatted input keeps the raw value in the control across blur and refocus', async ({
    page,
  }) => {
    await page.goto('/#/forms/input/utilities/input-format-reactive-forms');
    const input = page.getByRole('textbox', { name: 'Account number' });
    const value = page.getByTestId('account-value');

    await expect(input).toBeVisible();
    await expect(page.getByTestId('account-dirty')).toHaveText('Dirty: false');

    await focusAndSettle(page, input);
    await input.pressSequentially('12345678');
    await input.press('Tab');
    await expect(input).toHaveValue('1234 5678');
    await expect(value).toHaveText('Control value: 12345678');

    await focusAndSettle(page, input);
    await expect(input).toHaveValue('12345678');
    await expect(value).toHaveText('Control value: 12345678');
    await input.press('Tab');
    await expect(value).toHaveText('Control value: 12345678');
  });

  test('phone input loads empty and pristine, then carries typed digits', async ({ page }) => {
    await page.goto('/#/forms/input/phone/reactive-forms');
    const input = page.locator('main input.cngx-phone-input__number');
    const value = page.getByTestId('phone-value');

    await expect(input).toBeVisible();
    await expect(input).toHaveValue(/^\+1/);
    await expect(value).toHaveText('Control value: (empty)');
    await expect(page.getByTestId('phone-dirty')).toHaveText('Dirty: false');

    await focusAndSettle(page, input);
    await input.pressSequentially('2025550123');

    await expect(value).toHaveText('Control value: 12025550123');
    await expect(page.getByTestId('phone-touched')).toHaveText('Touched: false');
    await page.getByRole('button', { name: 'Reset' }).focus();
    await expect(page.getByTestId('phone-touched')).toHaveText('Touched: true');
  });
});
