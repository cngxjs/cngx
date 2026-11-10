import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Story: CngxActionButton - an async button with status labels and a live region.

test.describe('ui/action-button/async-button', () => {
  for (const { name, path } of routesUnder('ui', 'action-button')) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
    });
  }

  test.describe('string-labels artifact', () => {
    const route = routesUnder('ui', 'action-button').find((r) =>
      r.path.endsWith('/async-button/string-labels'),
    );

    test.beforeEach(async ({ page }) => {
      expect(route, 'string-labels route is generated').toBeDefined();
      await gotoDemo(page, route!.path);
    });

    test('save: busy while running, then the Saved! cell and the region', async ({ page }) => {
      const save = page.locator('button.cngx-action-button').nth(0);
      const region = save.locator('xpath=following-sibling::*[1]');
      await expect(region).toHaveAttribute('aria-live', 'polite');

      await save.click();
      await expect(save).toHaveAttribute('aria-busy', 'true');

      await expect(save).toHaveAttribute('data-status', 'success', { timeout: 10_000 });
      await expect(save.locator('.cngx-action-button__label[data-active]')).toHaveText('Saved!', {
        timeout: 10_000,
      });
      await expect(region).toHaveText('Saved!');
    });

    test('delete: the Failed! cell is active and the region says Failed!', async ({ page }) => {
      const del = page.locator('button.cngx-action-button').nth(1);
      const region = del.locator('xpath=following-sibling::*[1]');

      await del.click();
      await expect(del).toHaveAttribute('aria-busy', 'true');

      await expect(del).toHaveAttribute('data-status', 'error', { timeout: 10_000 });
      await expect(del.locator('.cngx-action-button__label[data-active]')).toHaveText('Failed!', {
        timeout: 10_000,
      });
      await expect(region).toHaveText('Failed!');
    });
  });
});
