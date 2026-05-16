import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxFocusTrap wraps the CDK FocusTrap. With autoFocus=true the
// first tabbable element gains focus on enable; Escape (wired by the
// host) closes the overlay; clicking the backdrop also dismisses.

test.describe('common/a11y/focus-trap', () => {
  test('modal-dialog: opening focuses the dialog input; Escape dismisses', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/focus-trap/modal-dialog');

    const openBtn = page.getByRole('button', { name: 'Open modal', exact: true });
    await openBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Confirm action' });
    await expect(dialog).toBeVisible();

    // autoFocus is on by default → first tabbable (the input) is focused.
    const confirmInput = page.getByPlaceholder('Type CONFIRM to proceed');
    await expect(confirmInput).toBeFocused();

    await expect(page).toHaveScreenshot('modal-open.png', { fullPage: true });

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('slide-out-drawer: left + right variants render and dismiss', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/focus-trap/slide-out-drawer');

    await page.getByRole('button', { name: 'Open right drawer' }).click();
    const rightDrawer = page.getByRole('dialog', { name: 'right drawer' });
    await expect(rightDrawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(rightDrawer).toHaveCount(0);

    await page.getByRole('button', { name: 'Open left drawer' }).click();
    const leftDrawer = page.getByRole('dialog', { name: 'left drawer' });
    await expect(leftDrawer).toBeVisible();

    await expect(page).toHaveScreenshot('drawer-left-open.png', { fullPage: true });
  });
});
