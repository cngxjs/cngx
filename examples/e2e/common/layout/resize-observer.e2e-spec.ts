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

    // The readout mirrors ResizeObserver's contentRect, which excludes border
    // and padding — so it does not equal the CSS width. Measure the same box
    // the observer reports instead of hardcoding the style value.
    const host = page.locator('[cngxresizeobserver]').first();
    const contentBox = () =>
      host.evaluate((el) => {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const horizontal =
          parseFloat(cs.borderLeftWidth) +
          parseFloat(cs.borderRightWidth) +
          parseFloat(cs.paddingLeft) +
          parseFloat(cs.paddingRight);
        const vertical =
          parseFloat(cs.borderTopWidth) +
          parseFloat(cs.borderBottomWidth) +
          parseFloat(cs.paddingTop) +
          parseFloat(cs.paddingBottom);
        return { w: rect.width - horizontal, h: rect.height - vertical };
      });

    const initial = await contentBox();
    await expect(width).toContainText(initial.w.toFixed(2));
    await expect(height).toContainText(initial.h.toFixed(2));

    // Resize the host — the observer must pick it up and the signals update.
    await host.evaluate((el) => {
      (el as HTMLElement).style.width = '480px';
      (el as HTMLElement).style.height = '160px';
    });
    const resized = await contentBox();
    expect(resized.w).toBeGreaterThan(initial.w);
    await expect(width).toContainText(resized.w.toFixed(2), { timeout: 2000 });
    await expect(height).toContainText(resized.h.toFixed(2));

  });
});
