import { expect, test } from '../_test';
import { describedText, gotoDemo } from '../_helpers';
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

  test.describe('external-state artifact', () => {
    test('the chrome drives busy and disabled without a click, success clears and speaks', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/external-state');
      const sync = page.locator('.cngx-ex-artifact button.cngx-action-button');
      const region = sync.locator('xpath=following-sibling::*[1]');
      const chrome = page.locator('.cngx-ex-chrome');

      await chrome.getByRole('button', { name: 'Start', exact: true }).click();
      await expect(sync).toHaveAttribute('aria-busy', 'true');
      await expect(sync).toHaveAttribute('aria-disabled', 'true');

      await chrome.getByRole('button', { name: 'Succeed', exact: true }).click();
      await expect(sync).not.toHaveAttribute('aria-busy');
      await expect(sync).not.toHaveAttribute('aria-disabled', 'true');
      await expect(region).toHaveText('Synced');
    });
  });

  test.describe('toasts artifact', () => {
    // Scoped to rendered toasts: the code panel quotes the same strings. The
    // Publish (error) path stays manual: [toastErrorDetail] without a mapper
    // logs the documented CNGX3004 dev warning, which the console guard fails.
    test('a toasted outcome shows in the Notifications region, not the button region', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/toasts');
      const save = page.locator('.cngx-ex-artifact button.cngx-action-button').nth(0);
      const toasts = page.getByRole('region', { name: 'Notifications' });

      await save.click();
      await expect(toasts.getByText('Draft saved', { exact: true })).toBeVisible({
        timeout: 5_000,
      });
      await expect(save).toHaveAttribute('data-status', 'success');
      await expect(save.locator('xpath=following-sibling::*[1]')).toHaveText('');
    });
  });

  test.describe('disabled-with-reason artifact', () => {
    test('aria-describedby names the reason only while the button is disabled', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/disabled-with-reason');
      const publish = page.locator('.cngx-ex-artifact button.cngx-action-button');
      const chrome = page.locator('.cngx-ex-chrome');

      await expect(publish).toHaveAttribute('aria-disabled', 'true');
      expect(await describedText(page, publish)).toBe('You need the editor role to publish.');

      await chrome.getByRole('button', { name: 'Grant editor role' }).click();
      await expect(publish).not.toHaveAttribute('aria-disabled', 'true');
      expect(await describedText(page, publish)).toBeNull();

      await chrome.getByRole('button', { name: 'Revoke editor role' }).click();
      await expect(publish).toHaveAttribute('aria-disabled', 'true');
      expect(await describedText(page, publish)).toBe('You need the editor role to publish.');
    });
  });

  test.describe('busy-timing artifact', () => {
    test('pending is immediate on both, only the default button waits out the show delay', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/busy-timing');
      const buttons = page.locator('.cngx-ex-artifact button.cngx-action-button');
      const timed = buttons.nth(0);
      const instant = buttons.nth(1);

      // Both clicks and the read happen in one task, two frames apart: well
      // inside the 120 ms show delay, so the default button is pending but
      // not yet busy while the zero-delay button is both.
      const early = await buttons.evaluateAll(async (els) => {
        for (const el of els) {
          (el as HTMLElement).click();
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return els.map((el) => ({
          pending: el.hasAttribute('data-pending'),
          busy: el.hasAttribute('data-busy'),
          ariaBusy: el.getAttribute('aria-busy'),
        }));
      });
      expect(early).toEqual([
        { pending: true, busy: false, ariaBusy: 'true' },
        { pending: true, busy: true, ariaBusy: 'true' },
      ]);

      await expect(timed).toHaveAttribute('data-busy', /.*/);
      await expect(timed).not.toHaveAttribute('data-pending', { timeout: 5_000 });
      await expect(instant).not.toHaveAttribute('data-pending', { timeout: 5_000 });
      await expect(timed).not.toHaveAttribute('data-busy');
      await expect(instant).not.toHaveAttribute('data-busy');
    });
  });
});
