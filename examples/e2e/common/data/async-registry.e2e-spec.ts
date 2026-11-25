import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const HTTP = 'common/data/async-registry/http-requests-in-the-registry';
const LABEL_SKIP = 'common/data/async-registry/label-and-skip-requests';
const LATENCY = 'common/data/async-registry/latency-selected-indicator';

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

  test('label-and-skip-requests: a labelled request is listed by its label', async ({ page }) => {
    await gotoDemo(page, LABEL_SKIP);
    const list = page.locator('.cngx-ex-artifact ul[aria-label="Requests in flight"]');
    await page.getByRole('button', { name: 'Load invoices' }).click();
    await expect(list.getByRole('listitem')).toHaveText(['Invoices: loading']);
    await expect(list.getByRole('listitem')).toHaveCount(0, { timeout: 4000 });
  });

  test('label-and-skip-requests: a skipped request never appears', async ({ page }) => {
    await gotoDemo(page, LABEL_SKIP);
    const list = page.locator('.cngx-ex-artifact ul[aria-label="Requests in flight"]');
    await page.getByRole('button', { name: 'Send heartbeat' }).click();
    await expect(readout(page, 'backend requests')).toHaveText('/api/heartbeat');
    await expect(list.getByRole('listitem')).toHaveCount(0);
    await expect(readout(page, 'isAnythingLoading()')).toHaveText('false');
    await expect(readout(page, 'backend requests')).toHaveText('-', { timeout: 4000 });
  });

  test('latency-selected-indicator: a slow envelope switches the next treatment to a skeleton', async ({
    page,
  }) => {
    await gotoDemo(page, LATENCY);
    const badge = page.locator('.cngx-ex-chrome .status-badge', { hasText: 'Next treatment' });
    const region = page.locator('.cngx-ex-artifact .latency-indicator [role="status"]');
    await expect(badge).toHaveText('Next treatment: spinner');

    await page.getByRole('button', { name: 'Run fast operation' }).click();
    await expect(page.locator('.cngx-ex-chrome .status-badge', { hasText: 'Last envelope' })).toHaveText(
      /Last envelope: \d+ms/,
    );
    await expect(badge).toHaveText('Next treatment: spinner');

    await page.getByRole('button', { name: 'Run slow operation' }).click();
    await expect(region).toHaveText('Loading');
    await expect(badge).toHaveText('Next treatment: skeleton', { timeout: 4000 });
    await expect(region).toHaveText('', { timeout: 4000 });

    await page.getByRole('button', { name: 'Run slow operation' }).click();
    await expect(region).toHaveText('Preparing content');
    await expect(page.locator('.cngx-ex-artifact .demo-skeleton-row')).toHaveCount(2);
  });
});
