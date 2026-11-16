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

      const hint = 'Publishing notifies every subscriber.';
      const reason = 'You need the editor role to publish.';
      await expect(publish).toHaveAttribute('aria-disabled', 'true');
      await expect(publish).toHaveAttribute('data-size', 'lg');
      expect(await describedText(page, publish)).toBe(`${hint} ${reason}`);

      await chrome.getByRole('button', { name: 'Grant editor role' }).click();
      await expect(publish).not.toHaveAttribute('aria-disabled', 'true');
      expect(await describedText(page, publish)).toBe(hint);

      await chrome.getByRole('button', { name: 'Revoke editor role' }).click();
      await expect(publish).toHaveAttribute('aria-disabled', 'true');
      expect(await describedText(page, publish)).toBe(`${hint} ${reason}`);
    });
  });

  test.describe('announcements-and-outputs artifact', () => {
    test('the region speaks the announcement, the outputs log each settle, a quiet button stays empty', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/announcements-and-outputs');
      const buttons = page.locator('.cngx-ex-artifact button.cngx-action-button');
      const exportBtn = buttons.nth(0);
      const quiet = buttons.nth(1);
      const events = page.locator('.cngx-ex-chrome .event-value');

      await exportBtn.click();
      await expect(exportBtn.locator('xpath=following-sibling::*[1]')).toHaveText(
        'Quarterly report exported.',
      );
      await expect(exportBtn.locator('.cngx-action-button__label[data-active]')).toHaveText(
        'Exported',
      );
      await expect(events).toHaveText(['export (settled) #1 success', 'export (outcome) success']);

      await quiet.click();
      await expect(quiet).toHaveAttribute('data-status', 'success');
      await expect(events.last()).toHaveText('quiet (outcome) success');
      await expect(quiet.locator('xpath=following-sibling::*[1]')).toHaveText('');
    });
  });

  test.describe('ejected-host artifact', () => {
    test('save runs to success with a spoken region, delete fails with its own label', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/ejected-host');
      const buttons = page.locator('.cngx-ex-artifact button[appejectedaction]');
      const save = buttons.nth(0);
      const del = buttons.nth(1);
      const active = (host: typeof save) => host.locator('[cngxActionStatusCell][data-active]');

      await save.click();
      await expect(active(save)).toHaveText('Saving...');
      await expect(save).toHaveAttribute('data-status', 'success', { timeout: 10_000 });
      await expect(save.locator('xpath=following-sibling::*[1]')).not.toHaveText('');

      await del.click();
      await expect(del).toHaveAttribute('data-status', 'error', { timeout: 10_000 });
      await expect(active(del)).toHaveText('Not allowed');
    });
  });

  test.describe('template-slots artifact', () => {
    test('the pending template shows, then one of the result templates, matched by the region', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/template-slots');
      const submit = page.locator('.cngx-ex-artifact button.cngx-action-button');
      const active = submit.locator('.cngx-action-button__label[data-active]');
      const region = submit.locator('xpath=following-sibling::*[1]');

      await submit.click();
      await expect(active).toHaveText('Processing...');
      await expect(submit).toHaveAttribute('data-status', /^(success|error)$/, {
        timeout: 10_000,
      });
      const outcome = /^\s*(Order placed!|.*Random failure - retry\?)\s*$/;
      await expect(active).toHaveText(outcome);
      const shown = (await active.textContent())?.trim() ?? '';
      await expect(region).toHaveText(shown);
    });
  });

  test.describe('app-wide-labels artifact', () => {
    test('the scoped labels fill unbound cells, a bound label wins, an empty one switches off', async ({
      page,
    }) => {
      await gotoDemo(page, 'ui/action-button/async-button/app-wide-labels');
      const artifact = page.locator('.cngx-ex-artifact');
      const host = (name: string) => artifact.locator('button.cngx-action-button', { hasText: name });
      const active = (name: string) => host(name).locator('.cngx-action-button__label[data-active]');
      const region = (name: string) => host(name).locator('xpath=following-sibling::*[1]');

      await host('Save').click();
      await expect(active('Save')).toHaveText('Working...');
      await expect(active('Save')).toHaveText('Done', { timeout: 10_000 });

      await host('Publish').click();
      await expect(active('Publish')).toHaveText('Published', { timeout: 10_000 });

      await host('Delete').click();
      await expect(active('Delete')).toHaveText('Failed', { timeout: 10_000 });

      await host('Archive').click();
      await expect(host('Archive')).toHaveAttribute('data-status', 'error', { timeout: 10_000 });
      await expect(active('Archive')).toHaveText('Archive');
      await expect(region('Archive')).not.toHaveText('');
    });
  });

  test.describe('random-outcome artifact', () => {
    test('the pending label, then Won! or Lost, matched by the region', async ({ page }) => {
      await gotoDemo(page, 'ui/action-button/async-button/random-outcome');
      // The slow latency keeps the run well past the busy show delay.
      await page.getByRole('radio', { name: /slow/ }).check();
      const roll = page.locator('.cngx-ex-artifact button.cngx-action-button');
      const active = roll.locator('.cngx-action-button__label[data-active]');

      await roll.click();
      await expect(active).toHaveText('Rolling...');
      await expect(roll).toHaveAttribute('data-status', /^(success|error)$/, { timeout: 10_000 });
      await expect(active).toHaveText(/^\s*(Won!|Lost)\s*$/);
      await expect(roll.locator('xpath=following-sibling::*[1]')).toHaveText(/^\s*(Won!|Lost)\s*$/);
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
