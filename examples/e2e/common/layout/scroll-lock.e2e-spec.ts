import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxScrollLock applies `overflow: hidden` and
// `scrollbar-gutter: stable` to <html> while ref-counting the lock so
// nested overlays don't clobber each other. Previous values are stashed
// on `data-cngx-prev-*` attributes for restoration.

test.describe('common/layout/scroll-lock', () => {
  test('toggle: <html> overflow flips while locked, restores cleanly on unlock', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/scroll-lock/toggle');

    const initial = await page.evaluate(() => ({
      overflow: getComputedStyle(document.documentElement).overflow,
      scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
    }));

    await page.getByRole('button', { name: 'Lock scroll' }).click();

    // The directive applies the lock via afterNextRender → wait for the
    // bookkeeping attribute to appear before reading computed style.
    await expect(page.locator('html')).toHaveAttribute('data-cngx-prev-overflow', /.*/);

    const locked = await page.evaluate(() => ({
      overflow: getComputedStyle(document.documentElement).overflow,
      scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
    }));
    expect(locked.overflow).toBe('hidden');
    expect(locked.scrollbarGutter).toBe('stable');

    await expect(page.locator('.status-badge', { hasText: 'LOCKED' })).toHaveClass(/active/);

    await page.getByRole('button', { name: 'Unlock scroll' }).click();

    // Wait for the bookkeeping attribute to be removed before reading style.
    await expect(page.locator('html')).not.toHaveAttribute('data-cngx-prev-overflow', /.*/);

    const restored = await page.evaluate(() => ({
      overflow: getComputedStyle(document.documentElement).overflow,
      scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
    }));
    expect(restored.overflow).toBe(initial.overflow);
    expect(restored.scrollbarGutter).toBe(initial.scrollbarGutter);

    await expect(page).toHaveScreenshot('scroll-lock-restored.png', { fullPage: true });
  });
});
