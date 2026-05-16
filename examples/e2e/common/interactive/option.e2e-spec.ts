import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxOption registers with a surrounding CngxActiveDescendant.
// Click highlights + activates, pointerenter only highlights. Disabled
// options are skipped by keyboard nav and click.

test.describe('common/interactive/option', () => {
  test('flat-options-with-ad: click activates, disabled is skipped, ArrowDown rotates', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/option/flat-options-with-ad');

    const listbox = page.getByRole('listbox', { name: 'Flat options' });
    await expect(listbox).toBeVisible();

    const paste = page.getByRole('option', { name: 'Paste', exact: true });
    const pasteSpecial = page.getByRole('option', { name: 'Paste Special', exact: true });
    const pasteValues = page.getByRole('option', { name: /Paste Values/ });
    const pasteFormatting = page.getByRole('option', { name: 'Paste Formatting', exact: true });

    await paste.click();
    const lastActivated = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last activated', { exact: true }) })
      .locator('.event-value');
    await expect(lastActivated).toHaveText('paste');

    // Click on the disabled option must not activate.
    await pasteValues.click({ force: true });
    await expect(lastActivated).toHaveText('paste');

    // ArrowDown from Paste → Paste Special → skip disabled → Paste Formatting.
    await listbox.focus();
    await paste.click();
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      await pasteSpecial.getAttribute('id') as string,
    );
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      await pasteFormatting.getAttribute('id') as string,
    );

    await expect(page).toHaveScreenshot('option-flat.png', { fullPage: true });
  });

  test('grouped-options: groups are presentational; navigation stays flat', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/option/grouped-options');

    const listbox = page.getByRole('listbox', { name: 'Grouped options' });
    await expect(listbox).toBeVisible();

    // Two groups, four options total — scope to inside the listbox.
    const groups = listbox.getByRole('group');
    await expect(groups).toHaveCount(2);
    await expect(listbox.getByRole('option')).toHaveCount(4);

    await page.getByRole('option', { name: 'Carrot' }).click();
    await expect(listbox).toHaveAttribute(
      'aria-activedescendant',
      /.+/,
    );

    await expect(page).toHaveScreenshot('option-grouped.png', { fullPage: true });
  });
});
