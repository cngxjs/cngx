import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const ROLLBACK = 'common/interactive/optimistic/rollback-on-failure';

function readout(page: Page, label: string) {
  return page
    .locator('.cngx-ex-chrome .event-row')
    .filter({ has: page.locator('.event-label', { hasText: label }) })
    .locator('.event-value');
}

test.describe('common/interactive/optimistic', () => {
  test('rollback-on-failure: a rejected update rolls back and is announced', async ({ page }) => {
    await gotoDemo(page, ROLLBACK);
    const region = page.locator('.cngx-ex-artifact .demo-sr-only[aria-live="polite"]');
    await expect(region).toHaveText('');

    await page.getByRole('button', { name: 'Set to Bob' }).click();
    await expect(readout(page, 'name()')).toHaveText('Bob');
    await expect(readout(page, 'name()')).toHaveText('Alice', { timeout: 4000 });
    await expect(readout(page, 'rolledBack()')).toHaveText('true');
    await expect(region).toHaveText('Update not saved, the name is back to Alice.');
  });

  test('rollback-on-failure: a confirmed update stays and says nothing', async ({ page }) => {
    await gotoDemo(page, ROLLBACK);
    const region = page.locator('.cngx-ex-artifact .demo-sr-only[aria-live="polite"]');
    await page.getByLabel('Server fails').uncheck();

    await page.getByRole('button', { name: 'Set to Bob' }).click();
    await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
    await expect(readout(page, 'name()')).toHaveText('Bob');
    await expect(readout(page, 'rolledBack()')).toHaveText('false');
    await expect(region).toHaveText('');
  });
});
