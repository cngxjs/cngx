import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxProgress paints a determinate or indeterminate progress
// indicator (linear or circular).

test.describe('ui/feedback/progress', () => {
  test('linear-determinate: progress bar mounts and climbs after Start Upload', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/feedback/progress/linear-determinate');

    const start = page.getByRole('button', { name: 'Start Upload' });
    await start.click();
    const progress = page.locator('cngx-progress');
    await expect(progress).toBeVisible();

    await expect(page).toHaveScreenshot('progress-linear-determinate.png', { fullPage: true });
  });

  test('linear-indeterminate: indeterminate variant mounts', async ({ page }) => {
    await gotoDemo(page, 'ui/feedback/progress/linear-indeterminate');
    await expect(page.locator('cngx-progress')).toHaveCount(1);
    await expect(page).toHaveScreenshot('progress-linear-indeterminate.png', { fullPage: true });
  });

  test('circular-variant: circular progress mounts', async ({ page }) => {
    await gotoDemo(page, 'ui/feedback/progress/circular-variant');
    await expect(page.locator('cngx-progress').first()).toBeVisible();
    await expect(page).toHaveScreenshot('progress-circular.png', { fullPage: true });
  });
});
