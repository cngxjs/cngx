import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxErrorState toggles `.cngx-error` plus reactive aria-invalid
// and aria-errormessage on its host. The IDs stay in the DOM; the linked
// message element gates its own aria-hidden.

test.describe('common/interactive/error-state', () => {
  test('basic: toggle flips aria-invalid and surfaces aria-errormessage', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error-state/basic-boolean-flag-flips-aria-invalid-aria-errormessage',
    );

    const input = page.getByPlaceholder('user@example.com');
    const toggle = page.getByRole('button', { name: 'Toggle invalid state' });

    await expect(input).toHaveAttribute('aria-invalid', 'false');
    // aria-errormessage is always wired per cngx convention.
    await expect(input).toHaveAttribute('aria-errormessage', 'email-error');

    await toggle.click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveClass(/cngx-error/);

    // The linked error message reveals via display:block when invalid.
    const msg = page.locator('#email-error');
    await expect(msg).toBeVisible();

    // Toggle back — aria-invalid flips, class lifts.
    await toggle.click();
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(input).not.toHaveClass(/cngx-error/);

    await expect(page).toHaveScreenshot('error-state-valid.png', { fullPage: true });
  });

  test('without-message-id: class hook and aria-invalid alone', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/error-state/without-message-id-class-hook-aria-invalid-only',
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

    await expect(page).toHaveScreenshot('error-state-class-only.png', { fullPage: true });
  });
});
