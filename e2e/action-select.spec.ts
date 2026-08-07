import { expect, test, type Locator, type Page } from '@playwright/test';

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

    const selectedRow = chrome(page).locator('.event-row').filter({ hasText: 'Selected' }).first();
    await expect(selectedRow).toContainText('Violet');
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

    const createdRow = chrome(page).locator('.event-row').filter({ hasText: 'created' }).last();
    await expect(createdRow).toContainText('Logistics');
  });

  test('async error surfaces commitError without touching the value', async ({ page }) => {
    await page.goto(ROUTES.async);
    const failCheckbox = chrome(page)
      .locator('label', { hasText: 'Server fails' })
      .locator('input[type="checkbox"]');
    await failCheckbox.check();

    const input = inputOf(page);
    await input.click();
    await input.fill('Purple');

    const actionBtn = artifact(page)
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    const errorRow = chrome(page).locator('.event-row').filter({ hasText: 'error' }).last();
    await expect(errorRow).toContainText(/rejected "Purple"/, { timeout: 3000 });

    const selectedRow = chrome(page).locator('.event-row').filter({ hasText: 'Selected' }).first();
    await expect(selectedRow).toContainText('—');
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
    const selectedRow = chrome(page).locator('.event-row').filter({ hasText: 'Selected' }).first();
    await expect(selectedRow).toContainText('KeyboardCreate');
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
