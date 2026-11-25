import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const RETRY = 'common/interactive/retry/createretry-cngxasyncclick';
const LIKE = 'common/interactive/retry/optimistic-instant-like-toggle';

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
    const button = retryButton(page);
    const attemptRegion = page.locator('.cngx-ex-artifact .demo-sr-only[aria-live="polite"]');
    // The polite region CngxAsyncClick renders as the host's next sibling.
    const settleRegion = button.locator('xpath=following-sibling::span[@role="status"][1]');
    await expect(attemptRegion).toHaveText('');
    const idleWidth = (await button.boundingBox())?.width;

    await page.getByRole('button', { name: 'Fail 3 times' }).click();
    await button.click();
    await expect(attemptRegion).toHaveText('Retrying, attempt 2 of 3', { timeout: 4000 });
    await expect(button).toHaveText('Attempt 2/3...');
    expect((await button.boundingBox())?.width).toBe(idleWidth);
    await expect(attemptRegion).toHaveText('Retrying, attempt 3 of 3', { timeout: 4000 });

    await expect(button).toHaveText('All retries failed', { timeout: 8000 });
    await expect(settleRegion).toHaveText('All retries failed');
    await expect(attemptRegion).toHaveText('');
    expect((await button.boundingBox())?.width).toBe(idleWidth);
    await expect(readout(page, 'Attempt')).toHaveText('3 / 3');
    await expect(readout(page, 'Exhausted')).toHaveText('true');
  });

  test('optimistic: a confirmed like stays and nothing rolls back', async ({ page }) => {
    await gotoDemo(page, LIKE);
    const region = page.locator('.cngx-ex-artifact .demo-sr-only[aria-live="polite"]');
    await page.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(readout(page, 'liked')).toHaveText('true');
    await expect(readout(page, 'Status')).toHaveText('success', { timeout: 4000 });
    await expect(readout(page, 'liked')).toHaveText('true');
    await expect(readout(page, 'Rolled back')).toHaveText('false');
    await expect(region).toHaveText('');
  });

  test('optimistic: a rejected like rolls back and is announced', async ({ page }) => {
    await gotoDemo(page, LIKE);
    const region = page.locator('.cngx-ex-artifact .demo-sr-only[aria-live="polite"]');
    await page.getByLabel('Server rejects').check();
    await page.getByRole('button', { name: 'Like', exact: true }).click();
    await expect(readout(page, 'liked')).toHaveText('true');
    await expect(readout(page, 'liked')).toHaveText('false', { timeout: 4000 });
    await expect(readout(page, 'Rolled back')).toHaveText('true');
    await expect(region).toHaveText('Change not saved, reverted.');
    await expect(readout(page, 'Error')).toHaveText('Server rejected');
  });
});
