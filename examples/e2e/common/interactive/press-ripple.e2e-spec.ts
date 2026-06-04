import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPressRipple composes CngxPressable + CngxRipple via host
// directives — a single attribute provides both press feedback (scale
// via `.cngx-pressed`) and a ripple wave.

test.describe('common/interactive/press-ripple', () => {
  test('buttons: three variants render with the host directive wired', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/press-ripple/buttons-with-press-ripple');

    const buttons = page.getByRole('button').filter({ hasText: /Default|Amber|C/ });
    await expect(buttons).toHaveCount(3);

    const defaultBtn = page.getByRole('button', { name: 'Default' });
    // Pressing the button should flip the cngx-pressed class while the
    // pointer is down. Use mouse down/up because click is too fast to catch.
    const box = await defaultBtn.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await expect(defaultBtn).toHaveClass(/cngx-pressed/);
    await page.mouse.up();
    await expect(defaultBtn).not.toHaveClass(/cngx-pressed/);

  });
});
