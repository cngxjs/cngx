import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: WAI-ARIA active-descendant keeps DOM focus on the host while a
// `aria-activedescendant` reference moves through options. Date is disabled
// and must be skipped by the keyboard nav.

test.describe('common/a11y/active-descendant', () => {
  test('listbox-with-items-input: arrow keys move highlight and skip disabled', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/a11y/active-descendant/listbox-with-items-input');

    const listbox = page.getByRole('listbox', { name: 'Fruits' });
    await expect(listbox).toBeVisible();

    // autoHighlightFirst is true — Apple should be the initial active id.
    const activeId = page.locator('.event-row', { hasText: 'Active id' }).locator('.event-value');
    await expect(activeId).toHaveText('fruit-apple');

    // Focus the host, then ArrowDown advances Apple → Banana.
    await listbox.focus();
    await page.keyboard.press('ArrowDown');
    await expect(activeId).toHaveText('fruit-banana');

    // ArrowDown again → Cherry.
    await page.keyboard.press('ArrowDown');
    await expect(activeId).toHaveText('fruit-cherry');

    // Next ArrowDown must skip Date (disabled) and land on Elderberry.
    await page.keyboard.press('ArrowDown');
    await expect(activeId).toHaveText('fruit-elder');

    // aria-activedescendant on the host points at the highlighted option.
    await expect(listbox).toHaveAttribute('aria-activedescendant', 'fruit-elder');

    // The highlighted option reports aria-selected="true".
    await expect(page.locator('#fruit-elder')).toHaveAttribute('aria-selected', 'true');

    // Enter commits → "Last activated" updates.
    await page.keyboard.press('Enter');
    const lastActivated = page
      .locator('.event-row', { hasText: 'Last activated' })
      .locator('.event-value');
    await expect(lastActivated).toHaveText('elder');

    await expect(page).toHaveScreenshot('listbox-with-items-input.png', { fullPage: true });
  });

  test('typeahead: typing letters jumps to matching option', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/active-descendant/typeahead');

    const listbox = page.getByRole('listbox', { name: 'Fruit typeahead' });
    await expect(listbox).toBeVisible();

    await listbox.focus();

    // typeaheadDebounce is 500ms; the directive resolves once the debounce
    // elapses. Type 'e' then wait for the value to commit.
    await page.keyboard.press('e');
    const activeValue = page
      .locator('.event-row', { hasText: 'Active value' })
      .locator('.event-value');
    await expect(activeValue).toHaveText('elder', { timeout: 2000 });

    await expect(page).toHaveScreenshot('typeahead.png', { fullPage: true });
  });
});
