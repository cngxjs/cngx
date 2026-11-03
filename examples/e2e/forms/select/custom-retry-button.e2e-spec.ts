import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: the custom *cngxSelectRetryButton slot. Projected slot content owns
// its tap target, so the story's warn button has to meet the 44px touch floor
// the default Retry meets under a coarse pointer (only an isMobile + hasTouch
// context reports one).
const ROUTE = 'forms/select/single-select/slot-override-cngxselectretrybutton';
const FLOOR = 44;

const retryOf = (page: Page) => page.locator('cngx-select .demo-select-retry-button--warn');

async function openLoadError(page: Page): Promise<Locator> {
  await gotoDemo(page, ROUTE);
  await page.getByRole('button', { name: 'Trigger load error' }).click();
  await page.locator('cngx-select .cngx-select__trigger').click();
  const retry = retryOf(page);
  await expect(retry).toBeVisible();
  return retry;
}

test.describe('custom retry button on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(({ browserName }) => {
    test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
  });

  test('the slot button is a touch-floor hit area', async ({ page }) => {
    const retry = await openLoadError(page);
    const box = await retry.boundingBox();
    expect(box, 'retry button has no box').not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(FLOOR - 0.5);
  });
});

test.describe('custom retry button on a desktop', () => {
  test('the slot button stays compact on a fine pointer', async ({ page }) => {
    const retry = await openLoadError(page);
    const box = await retry.boundingBox();
    expect(box, 'retry button has no box').not.toBeNull();
    expect(box!.height).toBeLessThan(FLOOR - 0.5);
  });
});
