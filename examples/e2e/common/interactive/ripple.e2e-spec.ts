import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxRipple injects a `.cngx-ripple__wave` span into the host on
// click. The wave carries inline CSS vars for position + size + color.

test.describe('common/interactive/ripple', () => {
  test('button-ripples: each variant injects a wave span on click', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/ripple/base/button-ripples');

    const target = page.getByRole('button', { name: 'Default ripple', exact: true });
    await expect(target).toHaveClass(/cngx-button/);
    await expect(target.locator('.cngx-ripple__wave')).toHaveCount(0);
    await target.click();
    await expect(target.locator('.cngx-ripple__wave')).toHaveCount(1);

    // The custom-color variant carries a custom rippleColor input.
    const custom = page.getByRole('button', { name: 'Custom color', exact: true });
    await custom.click();
    await expect(custom.locator('.cngx-ripple__wave')).toHaveCount(1);

    // The centred variant sits on an icon button.
    const centred = page.getByRole('button', { name: 'Centered ripple', exact: true });
    await expect(centred).toHaveClass(/cngx-icon-button/);
    await centred.click();
    await expect(centred.locator('.cngx-ripple__wave')).toHaveCount(1);

  });

  test('card-with-ripple: ripple paints on a card-shaped host', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/ripple/base/card-with-ripple');

    // An action cngx-card co-hosts the ripple directive.
    const card = page.locator('cngx-card[cngxripple]');
    await expect(card).toHaveCount(1);
    await card.click({ position: { x: 10, y: 10 } });
    await expect(card.locator('.cngx-ripple__wave')).toHaveCount(1);

  });
});
