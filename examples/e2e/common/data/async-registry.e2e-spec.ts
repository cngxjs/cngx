import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const HTTP = 'common/data/async-registry/http-requests-in-the-registry';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label').getByText(label, { exact: true }) })
    .locator('.event-value');
}

test.describe('common/data/async-registry', () => {
  test('http-requests-in-the-registry: two requests keep the registry busy until both settle', async ({
    page,
  }) => {
    await gotoDemo(page, HTTP);
    const indicator = page.locator('.cngx-ex-artifact [role="status"]');
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('false');

    await page.getByRole('button', { name: 'Load users and teams' }).click();
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('true');
    await expect(readout(page, 'activeOperations()')).toHaveText('2');
    await expect(indicator).toHaveText('Loading data...');
    await expect(readout(page, 'activeOperations()')).toHaveText('1', { timeout: 4000 });
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('true');
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('false', { timeout: 4000 });
    await expect(indicator).toHaveText('');
    await expect(readout(page, 'users')).toHaveText('3');
  });

  test('http-requests-in-the-registry: a failing request also ends busy', async ({ page }) => {
    await gotoDemo(page, HTTP);
    await page.getByLabel('Server fails').check();
    await page.getByRole('button', { name: 'Load users and teams' }).click();
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('true');
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('false', { timeout: 4000 });
    await expect(readout(page, 'activeOperations()')).toHaveText('0');
    await expect(readout(page, 'last error')).toHaveText('503 Service Unavailable');
  });
});
