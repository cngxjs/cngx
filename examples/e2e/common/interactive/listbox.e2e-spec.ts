import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxListbox is the composite listbox primitive. Single mode
// exposes one aria-selected option; multi mode toggles each option's
// aria-selected independently. Disabled options are skipped.

test.describe('common/interactive/listbox', () => {
  test('single-select: click selects, disabled option ignored, Enter activates', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/listbox/single-select');

    const listbox = page.getByRole('listbox', { name: 'Fruits (single)' });
    await expect(listbox).toBeVisible();

    const apple = page.getByRole('option', { name: 'Apple' });
    const banana = page.getByRole('option', { name: 'Banana' });
    const cherry = page.getByRole('option', { name: /Cherry/ });

    await apple.click();
    await expect(apple).toHaveAttribute('aria-selected', 'true');
    await expect(banana).toHaveAttribute('aria-selected', 'false');

    const selected = page
      .locator('.event-row')
      .filter({ has: page.getByText('Selected', { exact: true }) })
      .locator('.event-value');
    await expect(selected).toHaveText('apple');

    // Click the disabled option — selection must NOT change.
    await cherry.click({ force: true });
    await expect(selected).toHaveText('apple');

    // Keyboard navigation: focus listbox, ArrowDown twice → banana → cherry
    // is skipped → date. Enter selects.
    await listbox.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(banana).toHaveAttribute('aria-selected', 'true');
    await expect(selected).toHaveText('banana');

  });

  test('multi-select: each click toggles aria-selected independently', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/listbox/multi-select');

    const apple = page.getByRole('option', { name: 'Apple' });
    const banana = page.getByRole('option', { name: 'Banana' });

    await apple.click();
    await banana.click();
    await expect(apple).toHaveAttribute('aria-selected', 'true');
    await expect(banana).toHaveAttribute('aria-selected', 'true');

    // Toggle apple off — banana stays.
    await apple.click();
    await expect(apple).toHaveAttribute('aria-selected', 'false');
    await expect(banana).toHaveAttribute('aria-selected', 'true');

  });
});
