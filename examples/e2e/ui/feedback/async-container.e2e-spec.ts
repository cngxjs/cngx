import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

const MUTATION = 'ui/feedback/async-container/createasyncstate-mutation';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('.event-value');
}

test.describe('ui/feedback/async-container', () => {
  for (const { name, path } of routesIn('ui', 'feedback', 'async-container')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }

  test('createasyncstate-mutation: a save settles with success and the data', async ({ page }) => {
    await gotoDemo(page, MUTATION);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(readout(page, 'Status')).toHaveText('pending');
    await expect(readout(page, 'Status')).toHaveText('success', { timeout: 4000 });
    await expect(readout(page, 'Data')).toHaveText('OK');
  });

  test('createasyncstate-mutation: with the fail switch on a save settles with error', async ({
    page,
  }) => {
    await gotoDemo(page, MUTATION);
    await page.getByLabel('Fail next save').check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(readout(page, 'Status')).toHaveText('error', { timeout: 4000 });
    await expect(readout(page, 'Error')).toContainText('Server error');
  });
});
