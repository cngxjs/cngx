import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label').getByText(label, { exact: true }) })
    .locator('.event-value');
}

test.describe('common/interactive/error-source', () => {
  test('register-with-aggregator: sources add and remove their key, label and count', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/interactive/error/source/register-with-aggregator');
    const items = page.locator('.cngx-ex-artifact .demo-error-list li');

    await expect(readout(page, 'errorCount()')).toHaveText('1');
    await expect(readout(page, 'activeErrors keys')).toHaveText('email-format');
    await expect(items).toHaveText(['Format invalid']);
    await expect(readout(page, 'announcement()')).toContainText('Format invalid');

    await page.getByLabel('Server says taken').check();
    await expect(readout(page, 'errorCount()')).toHaveText('2');
    await expect(readout(page, 'activeErrors keys')).toHaveText('email-format, email-taken');
    await expect(items).toHaveText(['Format invalid', 'Already in use']);
    await expect(readout(page, 'announcement()')).toContainText('Already in use');

    await page.getByLabel('Format invalid').uncheck();
    await page.getByLabel('Server says taken').uncheck();
    await expect(readout(page, 'errorCount()')).toHaveText('0');
    await expect(readout(page, 'activeErrors keys')).toHaveText('-');
    await expect(items).toHaveCount(0);
  });
});
