import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSearch debounces the term; the demo filters a listbox, moves the
// active option with the arrow keys and commits on Enter.

test.describe('common/interactive/search', () => {
  test('typeahead-filter: typing filters, arrows move, Enter commits', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/search/typeahead-filter');

    const input = page.getByRole('combobox', { name: 'Search fruits' });
    const listbox = page.getByRole('listbox', { name: 'Fruit matches' });
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    await input.fill('ap');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(listbox.getByRole('option')).toHaveText([
      'Apple',
      'Apricot',
      'Grape',
      'Grapefruit',
      'Papaya',
      'Pineapple',
    ]);
    await expect(page.getByRole('status').filter({ hasText: 'matches' })).toHaveText('6 matches.');

    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'fruit-opt-0');
    await expect(listbox.getByRole('option', { name: 'Apple', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'fruit-opt-1');

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('typeahead-filter: Escape clears the active option, then the term', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/search/typeahead-filter');

    const input = page.getByRole('combobox', { name: 'Search fruits' });
    await input.fill('berry');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'fruit-opt-0');

    await page.keyboard.press('Escape');
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/);
    await expect(input).toHaveValue('berry');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
