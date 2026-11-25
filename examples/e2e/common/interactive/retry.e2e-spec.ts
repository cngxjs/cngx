import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const RETRY = 'common/interactive/retry/createretry-cngxasyncclick';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('.event-value');
}

function retryButton(page: Page) {
  return page.locator('.cngx-ex-artifact button').first();
}

test.describe('common/interactive/retry', () => {
  test('createRetry: an action that succeeds settles on attempt 1', async ({ page }) => {
    await gotoDemo(page, RETRY);
    await expect(readout(page, 'Attempt')).toHaveText('0 / 3');
    await retryButton(page).click();
    await expect(retryButton(page)).toHaveText('Success!', { timeout: 4000 });
    await expect(readout(page, 'Attempt')).toHaveText('1 / 3');
    await expect(readout(page, 'Exhausted')).toHaveText('false');
  });

  test('createRetry: two failures, then the third attempt succeeds', async ({ page }) => {
    await gotoDemo(page, RETRY);
    await page.getByRole('button', { name: 'Fail 2 times' }).click();
    await retryButton(page).click();
    await expect(retryButton(page)).toHaveText('Attempt 3/3...', { timeout: 6000 });
    await expect(retryButton(page)).toHaveText('Success!', { timeout: 4000 });
    await expect(readout(page, 'Attempt')).toHaveText('3 / 3');
    await expect(readout(page, 'Exhausted')).toHaveText('false');
  });

  test('createRetry: three failures exhaust the retries', async ({ page }) => {
    await gotoDemo(page, RETRY);
    await page.getByRole('button', { name: 'Fail 3 times' }).click();
    await retryButton(page).click();
    await expect(retryButton(page)).toHaveText('All retries failed', { timeout: 8000 });
    await expect(readout(page, 'Attempt')).toHaveText('3 / 3');
    await expect(readout(page, 'Exhausted')).toHaveText('true');
  });

  test('optimistic: liking updates the signal synchronously (rollback may follow)', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/retry/optimistic-instant-like-toggle');

    const btn = page.getByRole('button', { name: /Like|Liked/ });
    const likedVal = page
      .locator('.event-row')
      .filter({ has: page.getByText('liked', { exact: true }) })
      .locator('.event-value');

    await expect(likedVal).toHaveText('false');
    await btn.click();
    // Optimistic update flips the signal immediately to true. The server
    // call may later roll it back; either outcome is fine — what matters
    // is that the immediate post-click read is true.
    await expect(likedVal).toHaveText('true');

  });
});
