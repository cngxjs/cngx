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
  test('card-with-ripple: click, Enter and Space activate the card', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/ripple/base/card-with-ripple');

    const card = page.getByRole('button', { name: /Tappable card/ });
    const activations = page
      .locator('.event-row')
      .filter({ has: page.getByText('Activations', { exact: true }) })
      .locator('.event-value');
    await expect(activations).toHaveText('0');
    await card.click();
    await expect(activations).toHaveText('1');
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(activations).toHaveText('2');
    await page.keyboard.press(' ');
    await expect(activations).toHaveText('3');
  });
  test('ripple-under-reduced-motion: the scoped button carries the reduced motion axis', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/ripple/reduced-motion/ripple-under-reduced-motion');

    const scoped = page.getByRole('button', { name: 'Scoped motion' });
    const full = page.getByRole('button', { name: 'Full motion' });
    await expect(scoped.locator('xpath=ancestor::*[@data-motion="reduced"]')).toHaveCount(1);
    await expect(full.locator('xpath=ancestor::*[@data-motion="reduced"]')).toHaveCount(0);

    // The scope wins over the class rule: the wave gets the fade keyframes.
    // Press and read in one task: the reduced-motion net shortens the fade to
    // 0.01ms, so `animationend` can remove the wave before a second evaluate.
    const waveName = await scoped.evaluate((el) => {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 }));
      const wave = el.querySelector('.cngx-ripple__wave');
      return wave ? getComputedStyle(wave).animationName : 'no wave';
    });
    expect(waveName).toBe('cngx-ripple-fade');

    await page.getByRole('button', { name: 'Reduce motion on the right' }).click();
    await expect(scoped.locator('xpath=ancestor::*[@data-motion="reduced"]')).toHaveCount(0);
  });
});
