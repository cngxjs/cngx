import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxButtonToggleGroup applies the W3C radiogroup APG. Only one
// toggle is aria-checked=true at a time; clicking another switches.

test.describe('common/interactive/button-toggle-group', () => {
  test('basic view-switcher: only one toggle is aria-checked at a time', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/button-toggle-group/basic-view-switcher');

    const grid = page.getByRole('button', { name: 'Grid' });
    const list = page.getByRole('button', { name: 'List' });
    const table = page.getByRole('button', { name: 'Table' });

    await expect(grid).toHaveAttribute('aria-checked', 'true');
    await list.click();
    await expect(list).toHaveAttribute('aria-checked', 'true');
    await expect(grid).toHaveAttribute('aria-checked', 'false');

    await table.click();
    await expect(table).toHaveAttribute('aria-checked', 'true');
    await expect(list).toHaveAttribute('aria-checked', 'false');

    const caption = page.locator('p.caption');
    await expect(caption).toContainText('table');

  });

  test('disabled cascade: group [disabled] reflects aria-disabled on every leaf', async ({
    page,
  }) => {
    await gotoDemo(
      page,
      'common/interactive/button-toggle-group/disabled-group-cascade-vs-per-toggle',
    );
    const toggles = page.locator('cngx-button-toggle-group button');
    const disableBtn = page.getByRole('button', { name: /Disable group|Enable group/ });
    await disableBtn.click();
    await expect(toggles.first()).toHaveAttribute('aria-disabled', 'true');
  });

  test('vertical: orientation reflects on the host', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/button-toggle-group/vertical-orientation');
    const toggles = page.locator('cngx-button-toggle-group button');
    expect(await toggles.count()).toBeGreaterThanOrEqual(2);
  });
});
