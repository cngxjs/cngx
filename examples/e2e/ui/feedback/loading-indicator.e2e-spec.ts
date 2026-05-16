import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxLoadingIndicator renders a spinner or bar while `loading` is
// true. Delay + minDuration smooth quick flickers.

test.describe('ui/feedback/loading-indicator', () => {
  test('spinner-variant: spinner shows after clicking Start Loading', async ({ page }) => {
    await gotoDemo(page, 'ui/feedback/loading-indicator/spinner-variant');

    const start = page.getByRole('button', { name: 'Start Loading (2s)' });
    await start.click();
    // "Fetching data..." appears in both the visible widget and the code-
    // block snippet at the bottom; pick the visible <span>.
    const visibleSpan = page.locator('span', { hasText: 'Fetching data...' });
    await expect(visibleSpan).toBeVisible();
    await expect(page.locator('cngx-loading-indicator')).toBeVisible();

    await expect(page).toHaveScreenshot('loading-indicator-spinner.png', { fullPage: true });
  });

  test('bar-variant: component mounts inside the container (static demo)', async ({ page }) => {
    await gotoDemo(page, 'ui/feedback/loading-indicator/bar-variant');
    // This route has no trigger button — the indicator is rendered in its
    // idle state. Smoke that the component mounts at all.
    await expect(page.locator('cngx-loading-indicator')).toHaveCount(1);
    await expect(page).toHaveScreenshot('loading-indicator-bar.png', { fullPage: true });
  });
});
