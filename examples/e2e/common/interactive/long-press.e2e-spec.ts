import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxLongPress detects long-press gestures via Pointer Events.
// The default 500ms threshold fires (longPressed); a short tap does not.
// Moving more than 10px cancels.

test.describe('common/interactive/long-press', () => {
  test('visual-feedback: holding past the threshold fires longPressed', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/long-press/long-press-with-visual-feedback');

    const target = page.locator('div[cngxlongpress]').first().or(
      page.locator('div').filter({ hasText: 'Long press me' }),
    );
    await expect(target).toBeVisible();

    const completed = page
      .locator('.event-row')
      .filter({ has: page.getByText('Completed', { exact: true }) })
      .locator('.event-value');
    await expect(completed).toContainText('0');

    // Hold for 700ms — well past the default 500ms threshold.
    const box = await target.boundingBox();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();

    await expect(completed).toContainText('1', { timeout: 2000 });

    await expect(page).toHaveScreenshot('long-press-completed.png', { fullPage: true });
  });

  test('custom-threshold: 1-second hold flips button text mid-press', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/long-press/custom-threshold');

    const button = page.getByRole('button', { name: /Long press to delete/ });
    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    const x = box!.x + box!.width / 2;
    const y = box!.y + box!.height / 2;

    // Short press: 100ms is below the 1000ms threshold → label unchanged.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.up();
    await expect(button).toContainText('Long press to delete');

    // Mid-press (below the 1000ms threshold but well past the default
    // 0ms): longPressing() must be true → label flips to "Hold 1s...".
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /Hold 1s to delete/ })).toBeVisible();
    await page.mouse.up();

    await expect(page).toHaveScreenshot('long-press-custom-threshold.png', { fullPage: true });
  });
});
