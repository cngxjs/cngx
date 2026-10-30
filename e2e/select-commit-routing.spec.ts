import { expect, test, type Locator, type Page } from '@playwright/test';

// Retry routing and failure announcements across the commit core: a failed
// commit rolls back, is spoken assertively, and Retry replays the commit of
// the same kind (a reorder stays a reorder, a clear stays a clear).
const R = {
  reorder:
    '/#/forms/select/reorderable-multi-select/commit-action-optimistic-pessimistic-with-supersede',
  singleFail: '/#/forms/select/single-select/commiterrordisplay-variants-banner-inline-none',
};

// The demos log nothing on a rejected commit; any console error or warning,
// and any uncaught page error, is a regression. One known story-chrome line is
// tolerated: the reorder demo tracks its commit log by text, so a Retry that
// resends the same array (a reorder or a clear) within the same second
// repeats a key (NG0955).
const TOLERATED = [/^warning: NG0955: .*key "[^"]+ → \[[^\]]*\]"/s];
let consoleLines: string[] = [];

test.beforeEach(({ page }) => {
  consoleLines = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLines.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => consoleLines.push(`pageerror: ${err.message}`));
});

test.afterEach(() => {
  expect(consoleLines.filter((line) => !TOLERATED.some((re) => re.test(line)))).toEqual([]);
});

function main(page: Page): Locator {
  return page.locator('main');
}

function readout(page: Page, label: string): Locator {
  return main(page).locator('.event-row', { hasText: label }).locator('.event-value');
}

function assertiveRegion(page: Page): Locator {
  return page.locator('body > span.cngx-sr-only[aria-live="assertive"]').first();
}

async function setServerFails(page: Page, on: boolean): Promise<void> {
  const box = main(page)
    .locator('.cngx-ex-chrome label', { hasText: 'Server fails' })
    .locator('input');
  if ((await box.isChecked()) !== on) {
    // Click the wrapping label: a direct check() is flaky on WebKit radios/checkboxes here.
    await main(page).locator('.cngx-ex-chrome label', { hasText: 'Server fails' }).click();
  }
  await expect(box).toBeChecked({ checked: on });
}

test.describe('select commit routing', () => {
  test('a failed reorder rolls back, is spoken, and Retry resends the reorder', async ({
    page,
  }) => {
    await page.goto(R.reorder);
    const order = readout(page, 'Playlist order');
    await expect(order).toHaveText('s1 → s2 → s3 → s4 → s5');

    await setServerFails(page, true);
    await page.locator('[data-reorder-index="0"]').focus();
    await page.keyboard.press('Alt+ArrowRight');

    // The reorder reached the server; its rejection rolls the order back.
    await expect(readout(page, 'commit').last()).toContainText('[s2, s1, s3, s4, s5]');
    await expect(readout(page, 'error').first()).toContainText('Save failed (demo)');
    await expect(order).toHaveText('s1 → s2 → s3 → s4 → s5');
    await expect(assertiveRegion(page)).toContainText(/Playlist.*Save failed/);

    await setServerFails(page, false);
    const trigger = main(page).locator('cngx-reorderable-multi-select [role="combobox"]').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.cngx-select__commit-error').getByRole('button', { name: 'Retry' }).click();

    // The replay carries the reordered array, not a clear or an empty toggle.
    await expect(readout(page, 'commit')).toHaveCount(2);
    await expect(readout(page, 'commit').last()).toContainText('[s2, s1, s3, s4, s5]');
    await expect(order).toHaveText('s2 → s1 → s3 → s4 → s5');
    await expect(page.locator('.cngx-select__commit-error')).toHaveCount(0);
  });

  test('a failed clear keeps the selection and Retry resends the clear', async ({ page }) => {
    await page.goto(R.reorder);
    const order = readout(page, 'Playlist order');
    await setServerFails(page, true);

    await main(page)
      .locator('cngx-reorderable-multi-select')
      .getByRole('button', { name: 'Reset selection' })
      .click();
    await expect(readout(page, 'commit').last()).toContainText('[]');
    await expect(readout(page, 'error').first()).toContainText('Save failed (demo)');
    await expect(order).toHaveText('s1 → s2 → s3 → s4 → s5');
    await expect(assertiveRegion(page)).toContainText(/Playlist.*Save failed/);

    await setServerFails(page, false);
    const trigger = main(page).locator('cngx-reorderable-multi-select [role="combobox"]').first();
    await trigger.click();
    await page.locator('.cngx-select__commit-error').getByRole('button', { name: 'Retry' }).click();

    await expect(readout(page, 'commit')).toHaveCount(2);
    await expect(readout(page, 'commit').last()).toContainText('[]');
    // The demo renders an em dash for an empty playlist.
    await expect(order).toHaveText('\u2014');
  });

  test('a closed-trigger letter with a failing action rolls the single select back', async ({
    page,
  }) => {
    await page.goto(R.singleFail);
    await main(page).getByRole('button', { name: 'Fail next: off' }).click();
    await expect(main(page).getByRole('button', { name: 'Fail next: ON' })).toBeVisible();

    const trigger = main(page).locator('cngx-select .cngx-select__trigger').first();
    await expect(trigger).toContainText('Red');
    await trigger.focus();
    await page.keyboard.press('g');

    // Panel stays closed; the letter commits Green, the rejection restores Red.
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(assertiveRegion(page)).toContainText(/Color.*Save failed/);
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toContainText('Red');
    await expect(trigger).not.toContainText('Green');
  });
});
