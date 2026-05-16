import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCopyBlock renders the value content with a copy button.
// Clicking the button uses navigator.clipboard.writeText and flips the
// button label to the "copied" state.

test.describe('common/interactive/copy-block', () => {
  test('api-key: custom button label flips to copied label', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoDemo(page, 'common/interactive/copy-block/api-key');

    const block = page.locator('cngx-copy-block').first();
    const copyBtn = page.getByRole('button', { name: 'Copy Key' });
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();
    // Label flips to copied state. Match either the new aria-label or
    // a button whose accessible name contains the copied label.
    await expect(page.getByRole('button', { name: 'Key copied!' })).toBeVisible({
      timeout: 2000,
    });

    // The value was actually written to the clipboard.
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('sk_test_EXAMPLE_KEY');

    await expect(page).toHaveScreenshot('copy-block-api-key-copied.png', { fullPage: true });
  });

  test('code-snippet: default labels and successful copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoDemo(page, 'common/interactive/copy-block/code-snippet');

    const copyBtn = page.locator('cngx-copy-block button').first();
    await expect(copyBtn).toBeVisible();
    const initialLabel = (await copyBtn.textContent())?.trim() ?? '';
    expect(initialLabel.length).toBeGreaterThan(0);

    await copyBtn.click();
    // Label must change after the copy.
    await expect
      .poll(async () => (await copyBtn.textContent())?.trim())
      .not.toBe(initialLabel);

    await expect(page).toHaveScreenshot('copy-block-snippet-copied.png', { fullPage: true });
  });
});
