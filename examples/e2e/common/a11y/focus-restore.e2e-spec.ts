import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxFocusRestore records the currently focused element when its
// host enters the DOM, and returns focus to that element when the host
// is destroyed. Prevents focus from falling through to <body>.

test.describe('common/a11y/focus-restore', () => {
  test('panel: focus returns to the trigger button after the panel is destroyed', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/a11y/focus-restore/panel-with-automatic-restore');

    const openBtn = page.getByRole('button', { name: 'Open Panel' });
    await openBtn.focus();
    await expect(openBtn).toBeFocused();
    await openBtn.click();

    const closeBtn = page.getByRole('button', { name: 'Close Panel' });
    await expect(closeBtn).toBeVisible();
    // CngxFocusRestore should move focus into the freshly inserted panel.
    await closeBtn.focus();
    await expect(closeBtn).toBeFocused();

    await closeBtn.click();
    // After destruction, focus must restore to the original trigger.
    await expect(openBtn).toBeFocused();

    const state = page
      .locator('.event-row')
      .filter({ has: page.getByText('Panel open', { exact: true }) })
      .locator('.event-value');
    await expect(state).toHaveText('false');

    await expect(page).toHaveScreenshot('panel-restored.png', { fullPage: true });
  });

  test('inline-details: collapsing details returns focus to the toggle', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/focus-restore/inline-details');

    const toggle = page.getByRole('button', { name: 'Show Details' });
    await toggle.focus();
    await toggle.click();

    const nameInput = page.getByPlaceholder('Name');
    await expect(nameInput).toBeVisible();
    await nameInput.focus();
    await expect(nameInput).toBeFocused();

    const hideToggle = page.getByRole('button', { name: 'Hide Details' });
    await hideToggle.click();
    // Details are gone — focus should return to the (now-renamed) toggle.
    const showAgain = page.getByRole('button', { name: 'Show Details' });
    await expect(showAgain).toBeFocused();

    await expect(page).toHaveScreenshot('inline-details-collapsed.png', { fullPage: true });
  });
});
