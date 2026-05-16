import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxIntersectionObserver tracks visibility of its host against a
// configurable root. isIntersecting() / intersectionRatio() / (entered) /
// (left) all stay in sync as the user scrolls.

test.describe('common/layout/intersection-observer', () => {
  test('scroll-sentinel: entering and leaving the viewport updates counters', async ({ page }) => {
    await gotoDemo(page, 'common/layout/intersection-observer/scroll-sentinel');

    const enterCount = page
      .locator('.event-row')
      .filter({ has: page.getByText('entered', { exact: true }) })
      .locator('.event-value');
    const leaveCount = page
      .locator('.event-row')
      .filter({ has: page.getByText('left', { exact: true }) })
      .locator('.event-value');

    const scrollRoot = page.locator('.io-scroll-root');
    await expect(scrollRoot).toBeVisible();

    // The sentinel sits between two 400px spacers — initially off-screen.
    await expect(enterCount).toHaveText('0×');
    await expect(leaveCount).toHaveText('0×');

    // Scroll the sentinel into view.
    await scrollRoot.evaluate((el) => {
      el.scrollTop = 350;
    });
    await expect(enterCount).toHaveText('1×', { timeout: 2000 });

    // Scroll back to the top — sentinel leaves.
    await scrollRoot.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(leaveCount).toHaveText('1×', { timeout: 2000 });

    // Sentinel reads "Hidden" with ratio 0.00 when off-screen.
    const sentinel = scrollRoot.locator('div[cngxintersectionobserver], div').filter({
      hasText: /ratio:/,
    }).first();
    await expect(sentinel).toContainText('Hidden');
    await expect(sentinel).toContainText('ratio: 0.00');

  });
});
