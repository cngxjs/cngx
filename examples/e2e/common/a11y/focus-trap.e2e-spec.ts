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
    const confirmInput = page.getByLabel('Type CONFIRM to proceed');
    await expect(confirmInput).toBeFocused();


    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('slide-out-drawer: left + right variants render and dismiss', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/focus-trap/slide-out-drawer');

    // Both sides render the same drawer host, labelled 'Filter options'; the
    // side is reported by the Drawer readout, not by the accessible name.
    const drawer = page.getByRole('dialog', { name: 'Filter options' });
    const state = page
      .locator('.event-row')
      .filter({ has: page.getByText('Drawer', { exact: true }) })
      .locator('.event-value');

    await page.getByRole('button', { name: 'Open right drawer' }).click();
    await expect(drawer).toBeVisible();
    await expect(state).toHaveText('right, focus trapped');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);

    await page.getByRole('button', { name: 'Open left drawer' }).click();
    await expect(drawer).toBeVisible();
    await expect(state).toHaveText('left, focus trapped');

  });
});
