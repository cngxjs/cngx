import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

test.describe('common/interactive/error-scope', () => {
  test('reveal-on-submit: submit reveals the error, reset hides it again', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/error/scope/reveal-on-submit');
    const input = page.getByRole('textbox', { name: 'Email' });
    const alert = page.locator('.cngx-ex-artifact [role="alert"]');

    await expect(alert).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-invalid', 'false');

    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(alert).toHaveText('Email is required and must contain @.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    await input.fill('ada@example.com');
    await expect(alert).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-invalid', 'false');

    await input.fill('ada');
    await expect(alert).toHaveCount(1);
    await page.getByRole('button', { name: 'Reset scope' }).click();
    await expect(alert).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-invalid', 'false');
  });
});
