import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const HTTP_STATE = 'common/data/async-operators/tap-http-async-state';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('.event-value');
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
    await expect(readout(page, 'progress')).toHaveText('100', { timeout: 4000 });
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
});
