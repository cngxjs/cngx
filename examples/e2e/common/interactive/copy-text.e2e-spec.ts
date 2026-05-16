import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCopyText is a directive on a button. Clicking writes the
// bound value to the clipboard and flips `copied()` to true.

test.describe('common/interactive/copy-text', () => {
  test('copy-token: copied() signal flips and clipboard gets the token', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoDemo(page, 'common/interactive/copy-text/copy-token');

    const button = page.getByRole('button', { name: 'Copy' });
    const copiedRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('copied', { exact: true }) })
      .locator('.event-value');

    await expect(copiedRow).toHaveText('false');
    await button.click();
    await expect(copiedRow).toHaveText('true', { timeout: 2000 });
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('eyJhbGciOi');

    await expect(page).toHaveScreenshot('copy-text-token-copied.png', { fullPage: true });
  });

  test('copy-url-with-sr-announcement: clipboard receives a URL', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoDemo(page, 'common/interactive/copy-text/copy-url-with-sr-announcement');

    const buttons = page.locator('button[cngxcopytext], button[cngxCopyText]');
    const fallback = page.locator('button').filter({ hasText: /Copy/ });
    const target = (await buttons.count()) > 0 ? buttons.first() : fallback.first();
    await target.click();

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toMatch(/^https?:\/\//);

    await expect(page).toHaveScreenshot('copy-text-url-copied.png', { fullPage: true });
  });
});
