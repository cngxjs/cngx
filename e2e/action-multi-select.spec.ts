import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/action-multi-select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

function inputOf(section: Locator): Locator {
  return section.locator('cngx-action-multi-select input[role="combobox"]').first();
}

function chipStrip(section: Locator): Locator {
  return section.locator('cngx-action-multi-select .cngx-select__chip-list').first();
}

async function clickInPopover(btn: Locator): Promise<void> {
  await btn.dispatchEvent('click');
}

test.describe('CngxActionMultiSelect demo', () => {
  test('basic: create appends a chip to the values array and keeps the panel open', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — create appends');
    const input = inputOf(section);

    await input.click();
    await input.fill('Security');
    const actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const strip = chipStrip(section);
    await expect(strip.locator('cngx-chip')).toHaveCount(1);
    await expect(strip.locator('cngx-chip').first()).toContainText('Security');

    const countRow = section.locator('.event-row').filter({ hasText: 'Count' }).first();
    await expect(countRow).toContainText('1');
  });

  test('two consecutive creates append both chips (input auto-clears between)', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — create appends');
    const input = inputOf(section);

    await input.click();

    await input.fill('Security');
    let actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    const strip = chipStrip(section);
    await expect(strip.locator('cngx-chip')).toHaveCount(1);
    // Input auto-clears after a successful multi-create (tag-input UX).
    await expect(input).toHaveValue('');

    await input.fill('Compliance');
    actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toContainText('Compliance', { timeout: 2000 });
    await clickInPopover(actionBtn);

    await expect(strip.locator('cngx-chip')).toHaveCount(2);
    await expect(strip.locator('cngx-chip').nth(0)).toContainText('Security');
    await expect(strip.locator('cngx-chip').nth(1)).toContainText('Compliance');
    await expect(input).toHaveValue('');
  });

  test("change-event log captures the 'create' action discriminant", async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Pre-seeded + change-event log');
    const input = inputOf(section);

    await input.click();
    await input.fill('Logistics');
    const actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    const changeRow = section.locator('.event-row').filter({ hasText: 'change' }).last();
    await expect(changeRow).toContainText('create');
    await expect(changeRow).toContainText('Logistics');
  });

  test('async error surfaces commitError and leaves values untouched', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Async + error — rollback observation');
    const failCheckbox = section
      .locator('label', { hasText: 'Server fails' })
      .locator('input[type="checkbox"]');
    await failCheckbox.check();

    const input = inputOf(section);
    await input.click();
    await input.fill('Ops');
    const actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    const errorRow = section.locator('.event-row').filter({ hasText: 'error' }).last();
    await expect(errorRow).toContainText(/rejected "Ops"/, { timeout: 3000 });

    const valuesRow = section.locator('.event-row').filter({ hasText: 'Values' }).first();
    await expect(valuesRow).toContainText('—');
  });

  test('dirty-guard blocks click-outside dismissal while the note field is dirty', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Dirty guard — in-panel mini-form');
    const input = inputOf(section);

    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const note = section
      .locator('.cngx-select__action--bottom input[type="text"]')
      .first();
    await note.fill('important');

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    const cancelBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .filter({ hasText: 'Cancel' })
      .first();
    await clickInPopover(cancelBtn);
    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('Enter appends a chip via the quick-create flow without needing the action button', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — create appends');
    const input = inputOf(section);

    await input.click();
    await input.fill('alpha');
    await input.press('Enter');

    const strip = chipStrip(section);
    await expect(strip.locator('cngx-chip')).toHaveCount(1);
    await expect(strip.locator('cngx-chip').first()).toContainText('alpha');
    await expect(input).toHaveValue('');

    // Second one with Enter — chip count goes to 2.
    await input.fill('beta');
    await input.press('Enter');
    await expect(strip.locator('cngx-chip')).toHaveCount(2);
    await expect(strip.locator('cngx-chip').nth(1)).toContainText('beta');
  });

  test('closeOnCreate=true variant closes the panel after a successful create', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'closeOnCreate=true — confirm-to-create UX');
    const input = inputOf(section);

    await input.click();
    await input.fill('Alice');
    const actionBtn = section
      .locator('.cngx-select__action--bottom button[type="button"]')
      .first();
    await expect(actionBtn).toBeEnabled({ timeout: 2000 });
    await clickInPopover(actionBtn);

    await expect(input).toHaveAttribute('aria-expanded', 'false');
    const invitedRow = section.locator('.event-row').filter({ hasText: 'Invited' }).first();
    await expect(invitedRow).toContainText('Alice');
  });
});
