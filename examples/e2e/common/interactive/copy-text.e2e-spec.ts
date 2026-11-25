import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxCopyText is a directive on a button. Clicking writes the
// bound value to the clipboard and flips `copied()` (or `failed()`) to true.
// The atom ships no live region; both stories render their own.

const TOKEN = 'common/interactive/copy/text/copy-token';
const URL_ROUTE = 'common/interactive/copy/text/copy-url-with-sr-announcement';

function region(page: Page) {
  return page.locator('.cngx-ex-artifact .demo-sr-only[aria-live="polite"]');
}

// The two stories have no chrome switch, so the refusal is patched in before load.
async function refuseClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError')),
    });
  });
}

test.describe('common/interactive/copy-text', () => {
  test('copy-token: copied() signal flips, clipboard gets the token, the region speaks', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoDemo(page, TOKEN);

    const button = page.getByRole('button', { name: 'Copy' });
    const copiedRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('copied', { exact: true }) })
      .locator('.event-value');

    await expect(region(page)).toHaveText('');
    await expect(copiedRow).toHaveText('false');
    await button.click();
    await expect(copiedRow).toHaveText('true', { timeout: 2000 });
    await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    await expect(region(page)).toHaveText('Token copied to clipboard');

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('eyJhbGciOi');
  });

  test('copy-token: a refused write shows the failed label and is announced', async ({ page }) => {
    await refuseClipboard(page);
    await gotoDemo(page, TOKEN);
    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.getByRole('button', { name: 'Not copied' })).toBeVisible();
    await expect(region(page)).toHaveText('Token not copied');
  });

  test('copy-url-with-sr-announcement: clipboard receives the URL and the region speaks', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoDemo(page, URL_ROUTE);

    await expect(region(page)).toHaveText('');
    await page.getByRole('button', { name: 'Copy Link' }).click();
    await expect(region(page)).toHaveText('Link copied to clipboard');

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toMatch(/^https?:\/\//);
  });

  test('copy-url-with-sr-announcement: a refused write is shown and announced', async ({
    page,
  }) => {
    await refuseClipboard(page);
    await gotoDemo(page, URL_ROUTE);
    await page.getByRole('button', { name: 'Copy Link' }).click();
    await expect(page.getByRole('button', { name: 'Not copied' })).toBeVisible();
    await expect(region(page)).toHaveText('Link not copied');
  });
});
