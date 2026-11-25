import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

test.describe('common/interactive/error-registry', () => {
  test('inject-error-scope-programmatic: Validate marks the input invalid and ties it to the message', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/error/registry/inject-error-scope-programmatic');
    const input = page.getByRole('textbox', { name: 'Email' });

    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveAttribute('aria-errormessage');

    await page.getByRole('button', { name: 'Validate' }).click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const messageId = await input.getAttribute('aria-errormessage');
    expect(messageId).toBeTruthy();
    await expect(page.locator(`[id="${messageId}"]`)).toHaveText('Email must contain @.');

    await input.fill('ada@example.com');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveAttribute('aria-errormessage');
  });
});
