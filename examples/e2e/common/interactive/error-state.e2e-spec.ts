import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxErrorState toggles `.cngx-error` plus reactive aria-invalid
// and aria-errormessage on its host. aria-invalid stays in the DOM; the
// message id is referenced only while the flag is true.

test.describe('common/interactive/error-state', () => {
  test('basic: toggle flips aria-invalid and surfaces aria-errormessage', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error/state/basic-boolean-flag-flips-aria-invalid-aria-errormessage',
    );

    const input = page.getByLabel('Email');
    const toggle = page.getByRole('button', { name: 'Toggle invalid state' });

    // The message region is in the DOM from the start and holds no text
    // until the field is invalid, so its first sentence is a live change.
    const msg = page.locator('#cngx-error-state-basic-email');
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveAttribute('aria-errormessage');
    await expect(msg).toHaveCount(1);
    await expect(msg).toHaveText('');

    await toggle.click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-errormessage', 'cngx-error-state-basic-email');
    await expect(input).toHaveClass(/cngx-error/);
    await expect(msg).toHaveText('Please enter a valid email address.');
    await expect(msg).toBeVisible();

    await toggle.click();
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveClass(/cngx-error/);
    await expect(input).not.toHaveAttribute('aria-errormessage');
    await expect(msg).toHaveText('');
  });

  test('without-message-id: class hook and aria-invalid alone', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error/state/without-message-id-class-hook-aria-invalid-only',
    );

    // Angular strips the structural-directive attribute; locate by type.
    const input = page.locator('input[type="password"]');
    await expect(input).toHaveAttribute('aria-invalid', 'false');

    const toggle = page.getByRole('button', { name: 'Toggle invalid state' });
    await toggle.click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveClass(/cngx-error/);
    // No aria-errormessage was supplied for this story.
    await expect(input).not.toHaveAttribute('aria-errormessage', /.+/);

  });
});
