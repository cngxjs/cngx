import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMenu with CngxMenuItemCheckbox + CngxMenuItemRadio. Checkboxes
// flip aria-checked independently; radios within a group are mutually exclusive.

test.describe('common/interactive/menu-checkable', () => {
  test('text-formatting: checkboxes flip independently, radio group is mutually exclusive', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/menu-checkable/text-formatting-menu');

    const bold = page.getByRole('menuitemcheckbox', { name: 'Bold' });
    const italic = page.getByRole('menuitemcheckbox', { name: 'Italic' });

    // Bold starts on, italic starts off.
    await expect(bold).toHaveAttribute('aria-checked', 'true');
    await expect(italic).toHaveAttribute('aria-checked', 'false');
    await italic.click();
    await expect(italic).toHaveAttribute('aria-checked', 'true');
    await expect(bold).toHaveAttribute('aria-checked', 'true');

    const left = page.getByRole('menuitemradio', { name: 'Left' });
    const center = page.getByRole('menuitemradio', { name: 'Center' });
    await left.click();
    await expect(left).toHaveAttribute('aria-checked', 'true');
    await center.click();
    await expect(center).toHaveAttribute('aria-checked', 'true');
    await expect(left).toHaveAttribute('aria-checked', 'false');

    const italicRow = page
      .locator('.event-row')
      .filter({ has: page.getByText('Italic', { exact: true }) })
      .locator('.event-value');
    await expect(italicRow).toHaveText('on');

    await expect(page).toHaveScreenshot('menu-checkable.png', { fullPage: true });
  });
});
