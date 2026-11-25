import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const ROUTE = 'common/data/async-state/forwarded-state-through-an-input';

function panel(page: Page) {
  return page.locator('.cngx-ex-artifact demo-status-panel [role="status"]');
}

// Scoped to rendered toasts: the code panel quotes the same strings.
function toast(page: Page, text: string) {
  return page.getByRole('region', { name: 'Notifications' }).getByText(text, { exact: true });
}

test.describe('common/data/async-state', () => {
  test('forwarded-state-through-an-input: the panel follows whatever state is bound', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    await expect(panel(page)).toHaveText('Daily report: success');

    await page.getByRole('button', { name: 'Daily fails' }).click();
    await expect(panel(page)).toHaveText('Daily report: error');
    // The bare cngxToastOn inside the panel reads CNGX_STATEFUL, which forwards.
    await expect(toast(page, 'Report failed to load')).toBeVisible();

    await page.getByRole('button', { name: 'Bind weekly' }).click();
    await expect(panel(page)).toHaveText('Weekly report: loading');
    await page.getByRole('button', { name: 'Weekly loads' }).click();
    await expect(panel(page)).toHaveText('Weekly report: success');

    await page.getByRole('button', { name: 'Unbind' }).click();
    await expect(panel(page)).toHaveText('No report: idle');
  });
});
