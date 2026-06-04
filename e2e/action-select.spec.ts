import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/action-select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

function inputOf(section: Locator): Locator {
  return section.locator('cngx-action-select input[role="combobox"]').first();
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
    await page.goto(ROUTE);
    const section = card(page, 'Basic — sync quick-create');
    const input = inputOf(section);

    await input.click();
    await input.fill('Security');

    const actionBtn = section.locator('.action-slot-btn').first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await expect(actionBtn).toContainText('Security');
  });

  test('basic: clicking Create commits the new value and closes the panel', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — sync quick-create');
    const input = inputOf(section);

    await input.click();
    await input.fill('Violet');
    const actionBtn = section.locator('.action-slot-btn').first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    // Panel closes (default closeOnCreate = true).
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    const selectedRow = section.locator('.event-row').filter({ hasText: 'Selected' }).first();
    await expect(selectedRow).toContainText('Violet');
  });

  test('(created) output fires on pre-seeded demo and logs a line', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Pre-seeded + (created) output log');
    const input = inputOf(section);

    await input.click();
    await input.fill('Logistics');
    const actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    const createdRow = section.locator('.event-row').filter({ hasText: 'created' }).last();
    await expect(createdRow).toContainText('Logistics');
  });

  test('async error surfaces commitError without touching the value', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Async + error — rollback observation');
    const failCheckbox = section
      .locator('label', { hasText: 'Server fails' })
      .locator('input[type="checkbox"]');
    await failCheckbox.check();

    const input = inputOf(section);
    await input.click();
    await input.fill('Purple');

    const actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    const errorRow = section.locator('.event-row').filter({ hasText: 'error' }).last();
    await expect(errorRow).toContainText(/rejected "Purple"/, { timeout: 3000 });

    const selectedRow = section.locator('.event-row').filter({ hasText: 'Selected' }).first();
    await expect(selectedRow).toContainText('—');
  });

  test('dirty guard blocks click-outside dismissal while setDirty(true) is active', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Dirty guard — Escape cancel + click-outside blocked');
    const input = inputOf(section);

    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const descInput = section
      .locator('.cngx-select__action--bottom input[type="text"]')
      .first();
    await descInput.fill('mandatory note');

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    // Cancel release.
    const cancelBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .filter({ hasText: 'Cancel' })
      .first();
    await clickInPopover(cancelBtn);
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter in the trigger input fires quick-create when no option is active', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — sync quick-create');
    const input = inputOf(section);

    await input.click();
    await input.fill('KeyboardCreate');
    // No option matches — panel shows "empty" state with just the action slot.
    await input.press('Enter');

    await expect(input).toHaveAttribute('aria-expanded', 'false');
    const selectedRow = section.locator('.event-row').filter({ hasText: 'Selected' }).first();
    await expect(selectedRow).toContainText('KeyboardCreate');
  });

  test('Escape cancels the workflow when dirty instead of closing the panel', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Dirty guard — Escape cancel + click-outside blocked');
    const input = inputOf(section);

    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const descInput = section
      .locator('.cngx-select__action--bottom input[type="text"]')
      .first();
    await descInput.fill('important text');

    await descInput.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await descInput.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
