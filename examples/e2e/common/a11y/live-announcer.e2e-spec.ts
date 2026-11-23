import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: injectScopedLiveRegion appends a polite and an assertive region
// inside its host, here a panel inside an aria-modal dialog.

test.describe('common/a11y/live-announcer', () => {
  test('scoped announcing: messages land in regions inside the modal', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/live-announcer/scoped-announcing-in-a-modal');

    const opener = page.getByRole('button', { name: 'Open editor' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Edit draft' });
    await expect(dialog).toBeVisible();

    const polite = dialog.locator('[aria-live="polite"]');
    const assertive = dialog.locator('[aria-live="assertive"]');
    await expect(polite).toHaveCount(1);
    await expect(assertive).toHaveCount(1);

    await dialog.getByRole('button', { name: 'Save draft' }).click();
    await expect(polite).toHaveText('Draft saved');
    await dialog.getByRole('button', { name: 'Simulate failure' }).click();
    await expect(assertive).toHaveText('Save failed, try again');
    await expect(polite).toHaveText('Draft saved');

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[aria-live="assertive"]', { hasText: 'Save failed' })).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
  test('polite vs assertive: each politeness writes its own body region', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/live-announcer/polite-vs-assertive');

    const polite = page.locator('body > span.cngx-sr-only[aria-live="polite"]');
    const assertive = page.locator('body > span.cngx-sr-only[aria-live="assertive"]');

    await page.getByRole('button', { name: 'Announce polite' }).click();
    await expect(polite).toHaveText('Draft saved');

    await page.getByLabel('Message').fill('Save failed');
    await page.getByRole('button', { name: 'Announce assertive' }).click();
    await expect(assertive).toHaveText('Save failed');
    await expect(polite).toHaveText('Draft saved');
  });
});
