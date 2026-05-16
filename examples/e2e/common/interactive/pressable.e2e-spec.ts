import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPressable exposes a `pressed()` signal that flips while a
// pointer is held down on the host. The demo wires it to event-grid rows.

test.describe('common/interactive/pressable', () => {
  test('press-feedback: pressed() flips for the active button only', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/pressable/press-feedback-on-buttons');

    const btn1 = page.getByRole('button', { name: 'Scale Down' });
    const row1 = page
      .locator('.event-row')
      .filter({ has: page.getByText('Button 1', { exact: true }) })
      .locator('.event-value');
    const row2 = page
      .locator('.event-row')
      .filter({ has: page.getByText('Button 2', { exact: true }) })
      .locator('.event-value');

    await expect(row1).toHaveText('idle');

    const box = await btn1.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await expect(row1).toHaveText('pressed');
    await expect(row2).toHaveText('idle');
    await page.mouse.up();
    await expect(row1).toHaveText('idle');

    await expect(page).toHaveScreenshot('pressable.png', { fullPage: true });
  });

  test('tappable-card: card-shaped host responds to press', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/pressable/tappable-card');

    const card = page.locator('[cngxpressable]').first().or(page.locator('.cngx-pressable').first());
    await expect(card).toBeVisible();

    const box = await card.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    // CngxPressable should toggle `pressed()` and surface a `.cngx-pressed`
    // class on the host while held.
    await expect(card).toHaveClass(/cngx-pressable--pressed|cngx-pressed/);
    await page.mouse.up();

    await expect(page).toHaveScreenshot('tappable-card.png', { fullPage: true });
  });
});
