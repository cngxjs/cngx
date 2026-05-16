import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSwipeDismiss tracks pointer drag in a configured direction.
// Past the threshold, (swiped) fires and the counter climbs.

test.describe('common/interactive/swipe-dismiss', () => {
  test('directional-swipe: drag past 60px threshold increments swipe counter', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/swipe-dismiss/directional-swipe');

    // Angular strips the directive attribute. The host div is the one whose
    // inner <p> contains "Swipe left".
    const target = page.locator('div').filter({
      has: page.locator('p', { hasText: /^\s*Swipe \w+\s*$/ }),
    }).first();
    await expect(target).toBeVisible();

    const counter = page.locator('.status-badge', { hasText: 'dismissed' });
    await expect(counter).toContainText('0');

    const box = (await target.boundingBox())!;
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    // Default direction is "left" — drag leftwards beyond threshold (60px).
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 120, startY, { steps: 12 });
    await page.mouse.up();

    await expect(counter).toContainText('1', { timeout: 2000 });

    await expect(page).toHaveScreenshot('swipe-dismissed.png', { fullPage: true });
  });
});
