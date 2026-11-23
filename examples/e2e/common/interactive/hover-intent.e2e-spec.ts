import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Stories: CngxHoverIntent turns active only after the pointer rests for the
// enter delay; a fly-by never activates it. The fake clock drives the delay.

test.describe('common/interactive/hover-intent', () => {
  test('hover-to-reveal: a fly-by stays idle, a rest reveals, focus reveals too', async ({
    page,
  }) => {
    await page.clock.install();
    await gotoDemo(page, 'common/interactive/hover-intent/hover-to-reveal');

    const card = page.locator('[tabindex="0"]', { hasText: 'Project Aurora' });
    const state = page.getByText(/active\(\): (true|false)/);
    const details = card.getByText(/Owner: Dana Ruiz/);
    await expect(state).toHaveText(/false/);

    await card.hover();
    await page.clock.runFor(50);
    await page.mouse.move(0, 0);
    await page.clock.runFor(500);
    await expect(state).toHaveText(/false/);
    await expect(details).toHaveCount(0);

    await card.hover();
    await page.clock.runFor(300);
    await expect(state).toHaveText(/true/);
    await expect(details).toBeVisible();

    await page.mouse.move(0, 0);
    await page.clock.runFor(500);
    await expect(details).toHaveCount(0);

    await card.focus();
    await expect(details).toBeVisible();
  });

  test('hover-to-prefetch: resting past the delay prefetches once', async ({ page }) => {
    await page.clock.install();
    await gotoDemo(page, 'common/interactive/hover-intent/hover-to-prefetch');

    const card = page.locator('[tabindex="0"]', { hasText: 'Analytics report' });
    const flag = page.getByText(/prefetched: (true|false)/);
    await expect(flag).toHaveText(/false/);

    await card.hover();
    await page.clock.runFor(100);
    await expect(flag).toHaveText(/false/);
    await page.clock.runFor(300);
    await expect(flag).toHaveText(/true/);

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(flag).toHaveText(/false/);
    await card.focus();
    await expect(flag).toHaveText(/true/);
  });
});
