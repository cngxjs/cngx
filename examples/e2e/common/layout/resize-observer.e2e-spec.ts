import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxResizeObserver wraps ResizeObserver. isReady() flips to true
// after the first measurement; width()/height() update on every resize.
// The demo uses CSS `resize: horizontal` so the user can drag the box.

test.describe('common/layout/resize-observer', () => {
  test('live-size: signals reflect element dimensions and react to resize', async ({ page }) => {
    await gotoDemo(page, 'common/layout/resize-observer/live-size');

    const isReady = page
      .locator('.event-row')
      .filter({ has: page.getByText('isReady', { exact: true }) })
      .locator('.event-value');
    const width = page
      .locator('.event-row')
      .filter({ has: page.getByText('width', { exact: true }) })
      .locator('.event-value');
    const height = page
      .locator('.event-row')
      .filter({ has: page.getByText('height', { exact: true }) })
      .locator('.event-value');

    // First measurement lands very fast after mount.
    await expect(isReady).toHaveText('true', { timeout: 2000 });

    // Demo box starts at width: 300px, height: 120px (per inline style).
    await expect(width).toContainText('300');
    await expect(height).toContainText('120');

    // Programmatically set the host width to 480 — the observer should pick
    // it up and the signals must update.
    const host = page.locator('[cngxresizeobserver]').first();
    await host.evaluate((el) => {
      (el as HTMLElement).style.width = '480px';
      (el as HTMLElement).style.height = '160px';
    });
    await expect(width).toContainText('480', { timeout: 2000 });
    await expect(height).toContainText('160');

    await expect(page).toHaveScreenshot('resize-observer-after.png', { fullPage: true });
  });
});
