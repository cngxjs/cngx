import { expect, test } from '@playwright/test';

test.describe('input mask reactive forms story', () => {
  test('carries the raw value both ways and keeps the control clean at load', async ({ page }) => {
    await page.goto('/#/forms/input/mask/reactive-forms');
    const input = page.getByRole('textbox', { name: 'Start time' });
    const value = page.getByTestId('start-value');
    const dirty = page.getByTestId('start-dirty');

    await expect(input).toBeVisible();
    await expect(dirty).toHaveText('Start dirty: false');
    await expect(value).toHaveText('Start value:');

    await input.click();
    await input.pressSequentially('1430');
    await expect(input).toHaveValue('14:30');
    await expect(value).toHaveText('Start value: 1430');
    await expect(dirty).toHaveText('Start dirty: true');

    await page.getByRole('button', { name: 'Set 09:15' }).click();
    await expect(input).toHaveValue('09:15');
    await expect(value).toHaveText('Start value: 0915');

    await input.press('End');
    for (let i = 0; i < 4; i++) {
      await input.press('Backspace');
    }
    await expect(value).toHaveText('Start value:');
    await input.pressSequentially('2599');
    await input.blur();
    await expect(input).toHaveValue('25:99');
    await expect(page.locator('main cngx-field-errors').first()).toContainText(
      'Enter a valid time.',
    );
  });
});
