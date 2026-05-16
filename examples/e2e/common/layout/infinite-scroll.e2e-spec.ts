import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxInfiniteScroll uses IntersectionObserver against a scroll-root
// to fire (loadMore) when a sentinel enters the viewport. Loading is
// gated by (loading) and stops when (enabled) flips to false.

test.describe('common/layout/infinite-scroll', () => {
  test('scrollable-list: scrolling the root sentinel into view appends items', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/infinite-scroll/scrollable-list');

    const itemsBadge = page.locator('.status-badge').first();
    await expect(itemsBadge).toHaveText('Items: 5');

    const scrollRoot = page.locator('.scroll-root');
    await expect(scrollRoot).toBeVisible();

    // Scroll the root all the way down — sentinel intersects → loadMore fires.
    await scrollRoot.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Demo's loadMore appends 10 items after 800 ms delay. Allow plenty of
    // headroom — directive + computed signal + setTimeout all serialise.
    await expect(itemsBadge).toHaveText('Items: 15', { timeout: 5000 });

    // Trigger one more batch to confirm the loop continues working.
    await scrollRoot.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(itemsBadge).toHaveText('Items: 25', { timeout: 5000 });

    await expect(page).toHaveScreenshot('after-two-loads.png', { fullPage: true });
  });
});
