import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../examples/e2e/_test';

// One story = one example page. Each behaviour lives on its own leaf route;
// tests navigate per-example. The real artifact renders inside
// `.cngx-ex-artifact`; event-log / state readouts render in `.cngx-ex-chrome`.
const BASE = '/#/forms/select/action-select';
const ROUTES = {
  basic: `${BASE}/basic-sync-quick-create`,
  preSeeded: `${BASE}/pre-seeded-created-output-log`,
  async: `${BASE}/async-error-rollback-observation`,
  dirty: `${BASE}/dirty-guard-escape-cancel-click-outside-blocked`,
};

function artifact(page: Page): Locator {
  return page.locator('.cngx-ex-artifact');
}

function chrome(page: Page): Locator {
  return page.locator('.cngx-ex-chrome');
}

/** The demo chrome's state readout, exposed as a `data-cngx-ex-*` hook. */
function readout(page: Page, hook: string): Locator {
  return chrome(page).locator(`[data-cngx-ex-${hook}]`);
}

function inputOf(page: Page): Locator {
  return page.locator('cngx-action-select input[role="combobox"]').first();
}

/**
 * Click a button inside the CSS Popover API top-layer. Playwright's
 * `.click()` occasionally skips elements rendered in the browser's
 * popover top-layer — `dispatchEvent('click')` fires the click on the
 * element directly without routing through pointer coordinates.
 */
async function clickInPopover(btn: Locator): Promise<void> {
  await btn.dispatchEvent('click');
}

test.describe('CngxActionSelect demo', () => {
  test('basic: typing fills the slot `term` context and enables the create button', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const input = inputOf(page);

    await input.click();
    await input.fill('Security');

    const actionBtn = artifact(page).locator('.action-slot-btn').first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await expect(actionBtn).toContainText('Security');
  });

  test('basic: clicking Create commits the new value and closes the panel', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const input = inputOf(page);

    await input.click();
    await input.fill('Violet');
    const actionBtn = artifact(page).locator('.action-slot-btn').first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    // Panel closes (default closeOnCreate = true).
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    await expect(readout(page, 'selected')).toHaveAttribute('data-cngx-ex-selected', 'Violet');
  });

  test('(created) output fires on pre-seeded demo and logs a line', async ({ page }) => {
    await page.goto(ROUTES.preSeeded);
    const input = inputOf(page);

    await input.click();
    await input.fill('Logistics');
    const actionBtn = artifact(page)
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    await expect(readout(page, 'created')).toHaveAttribute('data-cngx-ex-created', /Logistics/);
  });

  test('async error surfaces commitError without touching the value', async ({ page }) => {
    await page.goto(ROUTES.async);
    const failCheckbox = chrome(page).locator('[data-cngx-ex-fail]');
    await failCheckbox.check();

    const input = inputOf(page);
    await input.click();
    await input.fill('Purple');

    const actionBtn = artifact(page)
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    await expect(readout(page, 'error')).toHaveAttribute('data-cngx-ex-error', /rejected "Purple"/, {
      timeout: 3000,
    });
    await expect(readout(page, 'selected')).toHaveAttribute('data-cngx-ex-selected', '');
  });

  test('dirty guard blocks click-outside dismissal while setDirty(true) is active', async ({ page }) => {
    await page.goto(ROUTES.dirty);
    const input = inputOf(page);

    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const descInput = artifact(page)
      .locator('.cngx-select__action--bottom input[type="text"]')
      .first();
    await descInput.fill('mandatory note');

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    // Cancel release.
    const cancelBtn = artifact(page)
      .locator('.cngx-select__action--bottom button[type="button"]')
      .filter({ hasText: 'Cancel' })
      .first();
    await clickInPopover(cancelBtn);
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter in the trigger input fires quick-create when no option is active', async ({ page }) => {
    await page.goto(ROUTES.basic);
    const input = inputOf(page);

    await input.click();
    await input.fill('KeyboardCreate');
    // No option matches — panel shows "empty" state with just the action slot.
    await input.press('Enter');

    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(readout(page, 'selected')).toHaveAttribute(
      'data-cngx-ex-selected',
      'KeyboardCreate',
    );
  });

  test('Escape cancels the workflow when dirty instead of closing the panel', async ({ page }) => {
    await page.goto(ROUTES.dirty);
    const input = inputOf(page);

    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const descInput = artifact(page)
      .locator('.cngx-select__action--bottom input[type="text"]')
      .first();
    await descInput.fill('important text');

    await descInput.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await descInput.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
