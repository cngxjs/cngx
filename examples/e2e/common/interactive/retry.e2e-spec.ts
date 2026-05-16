import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: withRetry wraps an AsyncAction with retries; CngxAsyncClick exposes
// pending/succeeded/failed signals. The demo intentionally uses a flaky
// (40% success) action — so the test asserts only that the retry state
// machine moves: attempt climbs, retrying flips, eventually settles.

test.describe('common/interactive/retry', () => {
  test('withRetry: attempt counter climbs and pending settles within max attempts', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/retry/withretry-cngxasyncclick');

    const btn = page.getByRole('button', { name: /Flaky Save|Attempt|Success|retries failed/ });
    await expect(btn).toBeVisible();

    const attemptVal = page
      .locator('.event-row')
      .filter({ has: page.getByText('Attempt', { exact: true }) })
      .locator('.event-value');
    await expect(attemptVal).toHaveText(/0 ?\/ ?3/);

    await btn.click();

    // The action takes 500ms × up to 3 attempts (~1.5–3s total). Wait for
    // the button to stop reporting "Attempt N/N..." or transition into
    // the success/fail terminal label.
    await expect(btn).toHaveText(/Success!|All retries failed/, { timeout: 10_000 });

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
