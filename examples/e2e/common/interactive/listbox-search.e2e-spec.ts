import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxListboxSearch is an input that drives a sibling CngxListbox.
// Typing filters the projected options by label substring.

test.describe('common/interactive/listbox-search', () => {
  test('command-palette: typing filters options live', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/listbox-search/command-palette');

    const search = page.getByPlaceholder('Search commands…');
    await expect(search).toBeVisible();

    const listbox = page.getByRole('listbox', { name: 'Palette' });
    const initialOptionCount = await listbox.locator('[role="option"]').count();
    expect(initialOptionCount).toBeGreaterThan(0);

    await search.fill('open');
    // CngxSearch debounces — poll until the count actually drops.
    await expect
      .poll(async () => listbox.locator('[role="option"]').count(), { timeout: 2000 })
      .toBeLessThan(initialOptionCount);
    const filtered = listbox.locator('[role="option"]');
    await expect(filtered.first()).toContainText(/open/i, { ignoreCase: true });

    // Click the first surviving option — Last selected updates.
    await filtered.first().click();
    const lastSelected = page
      .locator('.event-row')
      .filter({ has: page.getByText('Last selected', { exact: true }) })
      .locator('.event-value');
    await expect(lastSelected).not.toHaveText('—');

    // Clear → all options return after the debounce settles.
    await search.fill('');
    await expect
      .poll(async () => listbox.locator('[role="option"]').count(), { timeout: 2000 })
      .toBe(initialOptionCount);

  });
});
