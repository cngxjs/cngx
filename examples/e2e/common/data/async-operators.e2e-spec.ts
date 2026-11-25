import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const HTTP_STATE = 'common/data/async-operators/tap-http-async-state';
const PROGRESS = 'common/data/async-operators/tap-async-progress';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('.event-value');
}

// The success settle clears progress, so 100 is visible only until the
// response lands; poll every frame instead of on the retry back-off.
async function seesProgress(page: Page, value: string): Promise<void> {
  await page.waitForFunction(
    (expected) =>
      [...document.querySelectorAll<HTMLElement>('.cngx-ex-chrome .event-row')].some(
        (row: HTMLElement) =>
          row.querySelector('.event-label')?.textContent?.trim() === 'progress' &&
          row.querySelector('.event-value')?.textContent?.trim() === expected,
      ),
    value,
    { polling: 'raf', timeout: 4000 },
  );
}

test.describe('common/data/async-operators', () => {
  test('tap-http-async-state: an upload reports progress up to 100 and settles with success', async ({
    page,
  }) => {
    await gotoDemo(page, HTTP_STATE);
    const status = page.locator('.cngx-ex-artifact [role="status"]');
    await expect(readout(page, 'status')).toHaveText('idle');

    await page.getByRole('button', { name: 'Upload report' }).click();
    await expect(readout(page, 'status')).toHaveText('loading');
    await seesProgress(page, '100');
    await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
    await expect(readout(page, 'data')).toHaveText('report.pdf');
    await expect(status).toHaveText('Upload complete');
  });

  test('tap-http-async-state: with the fail switch the upload settles with error', async ({
    page,
  }) => {
    await gotoDemo(page, HTTP_STATE);
    await page.getByLabel('Server fails').check();
    await page.getByRole('button', { name: 'Upload report' }).click();
    await expect(readout(page, 'status')).toHaveText('error', { timeout: 4000 });
    await expect(page.locator('.cngx-ex-artifact [role="status"]')).toHaveText('Upload failed');
  });

  test('tap-async-progress: progress climbs and the consumer settles the state', async ({
    page,
  }) => {
    await gotoDemo(page, PROGRESS);
    await page.getByRole('button', { name: 'Download export' }).click();
    await expect(readout(page, 'status')).toHaveText('loading');
    await seesProgress(page, '50');
    await seesProgress(page, '100');
    await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
    await expect(readout(page, 'data')).toHaveText('3 rows');
    await expect(page.locator('.cngx-ex-artifact [role="status"]')).toHaveText('Download complete');
  });

  test('tap-async-progress: a failed download is settled as error by the consumer', async ({
    page,
  }) => {
    await gotoDemo(page, PROGRESS);
    await page.getByLabel('Server fails').check();
    await page.getByRole('button', { name: 'Download export' }).click();
    await expect(readout(page, 'status')).toHaveText('error', { timeout: 4000 });
    await expect(page.locator('.cngx-ex-artifact [role="status"]')).toHaveText('Download failed');
  });
});
