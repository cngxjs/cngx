import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';
import { routesIn } from '../../_routes';

const MUTATION = 'ui/feedback/async-container/createasyncstate-mutation';

// Scoped to rendered toasts: the code panel quotes the same strings.
function toast(page: Page, text: string) {
  return page.getByRole('region', { name: 'Notifications' }).getByText(text, { exact: true });
}

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

  test('createasyncstate-mutation: the Save button keeps focus through a save', async ({ page }) => {
    await gotoDemo(page, MUTATION);
    const save = page.locator('.cngx-ex-artifact button').first();
    await save.focus();
    await page.keyboard.press('Enter');
    await expect(readout(page, 'Status')).toHaveText('pending');
    await expect(save).toHaveAttribute('aria-disabled', 'true');
    await expect(save).not.toHaveAttribute('disabled');
    await expect(save).toBeFocused();
    await expect(readout(page, 'Status')).toHaveText('success', { timeout: 4000 });
    await expect(save).toBeFocused();
    await expect(save).not.toHaveAttribute('aria-disabled');
    await expect(toast(page, 'Saved')).toBeVisible();
  });

  test('createasyncstate-mutation: a rejected save is announced as an error toast', async ({
    page,
  }) => {
    await gotoDemo(page, MUTATION);
    await page.getByLabel('Fail next save').check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(readout(page, 'Status')).toHaveText('error', { timeout: 4000 });
    await expect(toast(page, 'Save failed')).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Notifications' }).getByRole('alert'),
    ).toContainText('Save failed');
  });

  test('cngxasync-with-custom-templates: a failed first load renders one alert with the error', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/feedback/async-container/cngxasync-with-custom-templates');
    await page.getByRole('button', { name: 'First load fails' }).click();
    const alert = page.locator('.cngx-ex-artifact [role="alert"]');
    await expect(alert).toHaveCount(1, { timeout: 4000 });
    await expect(alert).toHaveText('Network error');
  });

  for (const route of ['cngxasync-one-line', 'cngxasync-with-custom-templates']) {
    test(`${route}: first load, empty load and refresh render the right view`, async ({ page }) => {
      await gotoDemo(page, `ui/feedback/async-container/${route}`);
      const items = page.locator('.cngx-ex-artifact li.demo-card-tile');
      const skeleton = page.locator('.cngx-ex-artifact .demo-skeleton-bar');
      const custom = route === 'cngxasync-with-custom-templates';

      // The constructor starts a first load.
      await expect(readout(page, 'status')).toHaveText('loading');
      await expect(skeleton).toHaveCount(custom ? 3 : 0);
      await expect(items).toHaveCount(0);
      await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
      await expect(readout(page, 'Renders')).toHaveText(custom ? 'content template' : 'content');
      await expect(items).toHaveText(['Alice', 'Bob', 'Charlie']);

      await page.getByRole('button', { name: 'Refresh', exact: true }).click();
      await expect(readout(page, 'status')).toHaveText('refreshing');
      await expect(items).toHaveCount(3);
      await expect(skeleton).toHaveCount(0);
      await expect(items).toHaveCount(4, { timeout: 4000 });

      await page.getByRole('button', { name: 'First load, empty' }).click();
      await expect(readout(page, 'status')).toHaveText('success', { timeout: 4000 });
      await expect(items).toHaveCount(0);
      await expect(readout(page, 'Renders')).toHaveText(
        custom ? 'empty template' : 'nothing (no empty template)',
      );
      if (custom) {
        await expect(page.locator('.cngx-ex-artifact')).toContainText('No results found.');
      }
    });
  }
});
