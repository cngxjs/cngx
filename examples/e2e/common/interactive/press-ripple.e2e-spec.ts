import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPressRipple composes CngxPressable + CngxRipple via host
// directives on cngxButton / cngxIconButton hosts - a single attribute
// provides both press feedback (scale via `.cngx-pressed`) and a ripple wave.

test.describe('common/interactive/press-ripple', () => {
  test('buttons: three variants render with the host directive wired', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/ripple/press/buttons-with-press-ripple');

    const defaultBtn = page.getByRole('button', { name: 'Default', exact: true });
    const amberBtn = page.getByRole('button', { name: 'Amber ripple', exact: true });
    const centredBtn = page.getByRole('button', { name: 'Centered press + ripple', exact: true });
    await expect(defaultBtn).toHaveClass(/cngx-button/);
    await expect(amberBtn).toHaveClass(/cngx-button/);
    await expect(centredBtn).toHaveClass(/cngx-icon-button/);

    // Pressing the button should flip the cngx-pressed class while the
    // pointer is down. Use mouse down/up because click is too fast to catch.
    const box = await defaultBtn.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await expect(defaultBtn).toHaveClass(/cngx-pressed/);
    await expect(defaultBtn.locator('.cngx-ripple__wave')).toHaveCount(1);
    await page.mouse.up();
    await expect(defaultBtn).not.toHaveClass(/cngx-pressed/);

  });
});
