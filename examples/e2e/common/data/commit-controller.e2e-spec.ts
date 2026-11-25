import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const ROUTE = 'common/data/commit-controller/begin-supersede-cancel';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label').getByText(label, { exact: true }) })
    .locator('.event-value');
}

function pick(page: Page, name: string) {
  return page.getByRole('group', { name: 'Theme' }).getByRole('button', { name, exact: true });
}

function region(page: Page) {
  return page.locator('.cngx-ex-artifact [role="status"]');
}

test.describe('common/data/commit-controller', () => {
  test('begin-supersede-cancel: a successful commit writes the value', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await expect(readout(page, 'theme()')).toHaveText('light');
    await pick(page, 'Dark').click();
    await expect(readout(page, 'status')).toHaveText('pending');
    await expect(readout(page, 'intendedValue()')).toHaveText('dark');
    await expect(readout(page, 'theme()')).toHaveText('light');
    await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
    await expect(readout(page, 'theme()')).toHaveText('dark');
    await expect(region(page)).toHaveText('Theme saved: dark');
  });

  test('begin-supersede-cancel: a failed commit keeps the previous value', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await page.getByLabel('Server fails').check();
    await pick(page, 'Dark').click();
    await expect(readout(page, 'status')).toHaveText('error', { timeout: 4000 });
    await expect(readout(page, 'theme()')).toHaveText('light');
    await expect(region(page)).toHaveText('Could not save dark, kept light');
  });

  test('begin-supersede-cancel: a second begin supersedes the first', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    const theme = readout(page, 'theme()');
    await theme.evaluate((el) => {
      const w = window as unknown as { __themes: string[] };
      w.__themes = [];
      new MutationObserver(() => w.__themes.push(el.textContent?.trim() ?? '')).observe(el, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    await pick(page, 'Dark').click();
    await pick(page, 'High contrast').click();
    await expect(readout(page, 'intendedValue()')).toHaveText('high-contrast');
    await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
    await expect(theme).toHaveText('high-contrast');
    expect(await page.evaluate(() => (window as unknown as { __themes: string[] }).__themes)).toEqual([
      'high-contrast',
    ]);
  });

  test('begin-supersede-cancel: cancel returns the status to idle', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    await pick(page, 'Dark').click();
    await expect(readout(page, 'status')).toHaveText('pending');
    await pick(page, 'Cancel').click();
    await expect(readout(page, 'status')).toHaveText('idle');
    await expect(readout(page, 'theme()')).toHaveText('light');
    await expect(region(page)).toHaveText('');
  });
});
