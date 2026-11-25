import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

const ROUTE = 'common/data/async-resource/from-resource-and-http-resource';

test.describe('common/data/async-resource', () => {
  test('from-resource: content, failed reload, failed new region and idle', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    const section = page.getByRole('region', { name: 'Open orders' });
    const alerts = section.getByRole('alert');

    await expect(section.locator('p')).toHaveCount(0);

    await page.getByRole('radio', { name: 'North' }).check();
    await expect(section.locator('.demo-skeleton-line')).toBeVisible();
    await expect(section).toContainText('North: 11 open, 42 shipped', { timeout: 4000 });
    await expect(alerts).toHaveCount(0);

    // A failed reload keeps the old content and adds the reload alert.
    await page.getByLabel('Fail requests').check();
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(alerts).toHaveText(['Reload failed: Error: 503 Service Unavailable (North)'], {
      timeout: 4000,
    });
    await expect(section).toContainText('North: 11 open, 42 shipped');

    // A new region while failing has no old content: skeleton, then the error template.
    await page.getByRole('radio', { name: 'South' }).check();
    await expect(section.locator('.demo-skeleton-line')).toBeVisible();
    await expect(alerts).toHaveText(['Error: 503 Service Unavailable (South)'], { timeout: 4000 });
    await expect(section).not.toContainText('North:');

    await page.getByRole('radio', { name: 'None (idle)' }).check();
    await expect(section.locator('p')).toHaveCount(0);
    await expect(section.locator('.demo-skeleton-line')).toHaveCount(0);
  });
});
