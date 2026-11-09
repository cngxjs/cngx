import { expect, test } from '../../_test';
import { gotoDemo, collectConsoleMessages } from '../../_helpers';

// Story: CngxIconButton is an icon-only host on the button brain. The name
// comes from aria-label on the host (the CNGX1071 rule), the glyph sits in
// an aria-hidden span, and the axes land as data attributes with ghost as
// the default variant. The badge story keeps the count in the name.

const BASIC = 'common/button/icon-button/basic';
const BADGE = 'common/button/icon-button/with-badge';

test.describe('common/button/icon-button', () => {
  test('basic: every icon button is named by its host label, glyph hidden', async ({ page }) => {
    const nameWarnings = collectConsoleMessages(page, 'CNGX1071');
    await gotoDemo(page, BASIC);
    const artifact = page.locator('.cngx-ex-artifact');

    const rows = [
      ['Edit row', 'ghost', 'neutral'],
      ['Duplicate row', 'outline', 'neutral'],
      ['Add row', 'secondary', 'primary'],
      ['Delete row', 'ghost', 'danger'],
    ] as const;
    for (const [name, variant, tone] of rows) {
      const button = artifact.getByRole('button', { name, exact: true });
      await expect(button).toHaveAttribute('data-variant', variant);
      await expect(button).toHaveAttribute('data-tone', tone);
      await expect(button).toHaveAttribute('type', 'button');
      await expect(button.locator('.cngx-icon-button__glyph')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }

    const sizes = [
      ['Add, extra small', 'xs'],
      ['Add, small', 'sm'],
      ['Add, medium', 'md'],
      ['Add, large', 'lg'],
    ] as const;
    for (const [name, size] of sizes) {
      await expect(artifact.getByRole('button', { name, exact: true })).toHaveAttribute(
        'data-size',
        size,
      );
    }

    // Every host carries a name, so the icon-only rule stays quiet.
    await expect(artifact.getByRole('button')).toHaveCount(8);
    expect(nameWarnings).toEqual([]);
  });

  test('with-badge: the count is part of the name and follows the state', async ({ page }) => {
    await gotoDemo(page, BADGE);
    const artifact = page.locator('.cngx-ex-artifact');

    const bell = artifact.getByRole('button', { name: 'Notifications, 3 unread' });
    await expect(bell).toHaveAttribute('data-variant', 'outline');
    await page.getByRole('button', { name: 'Add notification' }).click();
    await expect(artifact.getByRole('button', { name: 'Notifications, 4 unread' })).toBeVisible();
  });
});
