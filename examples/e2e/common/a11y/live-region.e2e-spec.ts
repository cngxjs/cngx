import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxLiveRegion mirrors a politeness signal onto aria-live and
// flips role between status/alert. AT consumes the message change; the
// demo also flashes the region so we can verify the visual side-channel.

test.describe('common/a11y/live-region', () => {
  test('polite vs assertive: ARIA attributes follow the politeness signal', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/live-region/polite-vs-assertive');

    const ariaLive = page
      .locator('.event-row')
      .filter({ has: page.getByText('aria-live', { exact: true }) })
      .locator('.event-value');
    const role = page
      .locator('.event-row')
      .filter({ has: page.getByText('role', { exact: true }) })
      .locator('.event-value');

    // Default starts as polite → role=status.
    await expect(ariaLive).toHaveText('polite');
    await expect(role).toHaveText('status');

    await page.getByRole('button', { name: 'assertive' }).click();
    await expect(ariaLive).toHaveText('assertive');
    // Assertive must surface as role="alert" for screen readers.
    await expect(role).toHaveText('alert');

    await page.getByRole('button', { name: 'Trigger announcement' }).click();
    // Region content updates with the latest announcement.
    const region = page.locator('[cngxliveregion]');
    await expect(region).toContainText(/Action completed — count: 1/);

    await expect(page).toHaveScreenshot('assertive-announced.png', { fullPage: true });
  });

  test('form validation: assertive error message appears as the input changes', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/a11y/live-region/form-validation-assertive-error-announcements');

    const input = page.getByPlaceholder('user@example.com');
    const errorRegion = page.locator('#email-error');

    await input.fill('invalid');
    // The code-block at the bottom of every demo also contains the literal
    // strings, so the error must be asserted via the region locator only.
    await expect(errorRegion).toContainText('Missing @ symbol');
    await expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
    await expect(errorRegion).toHaveAttribute('role', 'alert');

    await input.fill('user@example');
    await expect(errorRegion).toContainText('Missing domain (e.g. .com)');

    await expect(page).toHaveScreenshot('missing-domain.png', { fullPage: true });
  });
});
