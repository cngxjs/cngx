import { expect, test } from '@playwright/test';

test.describe('field error basic story', () => {
  test('keeps the manual error slot empty until the field is touched', async ({ page }) => {
    await page.goto('/#/forms/field/error/basic');
    const input = page.getByRole('textbox', { name: 'Username' });
    const slot = page.locator('main .cngx-error');

    await expect(input).toBeVisible();
    await expect(slot).toBeAttached();
    await expect(slot).toHaveText('');

    await input.focus();
    await input.blur();
    await expect(slot).toContainText('Username is required');
    await expect(slot).toHaveAttribute('role', 'alert');
  });
});
