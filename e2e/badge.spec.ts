import { expect, test } from '@playwright/test';

test.describe('CngxBadge demo', () => {
  test('renders counts and overflow', async ({ page }) => {
    await page.goto('/#/common/display/badge/counts-with-overflow');
    const indicators = page.locator('.cngx-ex-artifact .cngx-badge-indicator');
    await expect(indicators.first()).toHaveText('3');
    const overflow = page.locator('button.chip', { hasText: 'Notifications' }).locator('.cngx-badge-indicator');
    await expect(overflow).toHaveText('99+');
  });

  test('badge is aria-hidden', async ({ page }) => {
    await page.goto('/#/common/display/badge/counts-with-overflow');
    const any = page.locator('.cngx-badge-indicator').first();
    await expect(any).toHaveAttribute('aria-hidden', 'true');
  });

  test('dot mode renders empty indicator with dot class', async ({ page }) => {
    await page.goto('/#/common/display/badge/colors-and-dot-mode');
    const live = page.locator('button.chip', { hasText: 'Live' }).locator('.cngx-badge-indicator');
    await expect(live).toHaveClass(/cngx-badge-indicator--dot/);
    await expect(live).toHaveText('');
  });

  test('hidden badge is not in the DOM', async ({ page }) => {
    await page.goto('/#/common/display/badge/inline-and-hidden');
    const hiddenBtn = page.locator('button.chip', { hasText: 'Hidden' });
    await expect(hiddenBtn.locator('.cngx-badge-indicator')).toHaveCount(0);
  });
});
