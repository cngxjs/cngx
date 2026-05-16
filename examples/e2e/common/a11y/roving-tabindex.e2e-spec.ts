import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxRovingTabindex drives the WAI-ARIA roving-tabindex pattern.
// Arrow keys move focus *within* the group; Tab leaves the group. Items
// marked disabled are skipped during the rove.

test.describe('common/a11y/roving-tabindex', () => {
  test('horizontal toolbar: ArrowRight rotates focus and skips disabled items', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/a11y/roving-tabindex/horizontal-toolbar');

    const toolbar = page.getByRole('toolbar', { name: 'Text formatting' });
    await expect(toolbar).toBeVisible();

    const bold = page.getByRole('button', { name: 'Bold' });
    await bold.focus();
    await expect(bold).toBeFocused();

    const activeIndex = page
      .locator('.event-row')
      .filter({ has: page.getByText('Active index', { exact: true }) })
      .locator('.event-value');
    await expect(activeIndex).toHaveText('0');

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Italic' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Underline' })).toBeFocused();
    // Next ArrowRight must skip "Strikethrough" (disabled) and land on Code.
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: 'Code' })).toBeFocused();
    await expect(activeIndex).toHaveText('4');

    // End jumps to last enabled item (already there); Home jumps to first.
    await page.keyboard.press('Home');
    await expect(bold).toBeFocused();
    await expect(activeIndex).toHaveText('0');

    await expect(page).toHaveScreenshot('toolbar-focus-bold.png', { fullPage: true });
  });

  test('vertical menu: ArrowDown moves through menuitems', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/roving-tabindex/vertical-menu');

    const menu = page.getByRole('menu', { name: 'Actions' });
    await expect(menu).toBeVisible();

    const cut = page.getByRole('menuitem', { name: 'Cut' });
    await cut.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Copy' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Paste' })).toBeFocused();

    await expect(page).toHaveScreenshot('vertical-menu-paste.png', { fullPage: true });
  });
});
