import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSwipe emits the dominant direction past the threshold; the demo
// pages on left/right and offers Previous/Next as the non-gesture path.

test.describe('common/interactive/swipe', () => {
  test('swipe-to-page: a left drag pages forward, a right drag pages back', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/gestures/swipe/swipe-to-page');

    const card = page.getByText(/^\s*Page \d of 3/);
    await expect(card).toContainText('Page 1 of 3');

    const drag = async (dx: number) => {
      const box = (await card.boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 12 });
      await page.mouse.up();
    };

    await drag(-140);
    await expect(card).toContainText('Page 2 of 3');
    await drag(140);
    await expect(card).toContainText('Page 1 of 3');
  });

  test('swipe-to-page: Previous and Next page without a gesture', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/gestures/swipe/swipe-to-page');

    const card = page.getByText(/^\s*Page \d of 3/);
    const next = page.getByRole('button', { name: 'Next' });
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(card).toContainText('Page 2 of 3');
    await page.keyboard.press('Enter');
    await expect(card).toContainText('Page 3 of 3');
    await expect(next).toBeDisabled();
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(card).toContainText('Page 2 of 3');
  });
});
