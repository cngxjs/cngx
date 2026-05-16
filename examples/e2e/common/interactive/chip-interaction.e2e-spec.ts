import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxChipInteraction upgrades a CngxChip with role=option,
// aria-selected, click/Space/Enter toggling, and an optional remove flow.

test.describe('common/interactive/chip-interaction', () => {
  test('basic: click + Space + Enter all flip aria-selected', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/chip-interaction/basic-toggle-on-click-space-or-enter');

    const favourite = page.locator('cngx-chip[cngxchipinteraction]').filter({ hasText: 'Favourite' });
    const featured = page.locator('cngx-chip[cngxchipinteraction]').filter({ hasText: 'Featured' });

    // Initial state from signals: favourite=false, featured=true.
    await expect(favourite).toHaveAttribute('aria-selected', 'false');
    await expect(featured).toHaveAttribute('aria-selected', 'true');

    await favourite.click();
    await expect(favourite).toHaveAttribute('aria-selected', 'true');

    // Space toggles back off.
    await favourite.focus();
    await page.keyboard.press('Space');
    await expect(favourite).toHaveAttribute('aria-selected', 'false');

    // Enter toggles on.
    await page.keyboard.press('Enter');
    await expect(favourite).toHaveAttribute('aria-selected', 'true');

    await expect(page).toHaveScreenshot('chip-interaction-both-selected.png', { fullPage: true });
  });

  test('disabled state: toggle locks the chip; clicks no longer flip selection', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/chip-interaction/disabled-state');

    const chip = page.locator('cngx-chip[cngxchipinteraction]').first();
    // Demo starts NOT disabled (locked=false); pressing the toggle locks it.
    await expect(chip).not.toHaveAttribute('aria-disabled', 'true');
    const initialSelected = await chip.getAttribute('aria-selected');

    await page.getByRole('button', { name: 'toggle disabled' }).click();
    await expect(chip).toHaveAttribute('aria-disabled', 'true');

    // Disabled chip must ignore click — aria-selected stays the same.
    await chip.click({ force: true });
    expect(await chip.getAttribute('aria-selected')).toBe(initialSelected);

    await expect(page).toHaveScreenshot('chip-interaction-disabled.png', { fullPage: true });
  });

  test('removable: Backspace fires removeRequest and increments the counter', async ({ page }) => {
    await gotoDemo(
      page,
      'common/interactive/chip-interaction/removable-with-removerequest-on-backspace-delete',
    );

    const chip = page.locator('cngx-chip[cngxchipinteraction]').first();
    await chip.focus();

    // Demo shows "remove fired: N" — counter is a <code> inside p.caption.
    const counter = page.locator('p.caption code').first();
    await expect(counter).toHaveText('0');

    await page.keyboard.press('Backspace');
    await expect(counter).toHaveText('1');

    await expect(page).toHaveScreenshot('chip-interaction-remove.png', { fullPage: true });
  });
});
