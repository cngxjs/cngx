import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('CngxTypeahead demo', () => {
  test('basic: role="combobox" + aria-autocomplete="list" on the input', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Typeahead — single-value');
    const input = section.locator('input.cngx-typeahead__input').first();
    await expect(input).toHaveAttribute('role', 'combobox');
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('typing filters suggestions and toggles aria-expanded', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Typeahead — single-value');
    const input = section.locator('input.cngx-typeahead__input').first();
    await input.click();
    await input.fill('Ali');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const visibleRows = section.locator('[cngxOption]');
    await expect(visibleRows).toHaveCount(1);
    await expect(visibleRows.first()).toContainText('Alice Meier');
  });

  test('picking an option commits the value and seeds the input via displayWith', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Typeahead — single-value');
    const input = section.locator('input.cngx-typeahead__input').first();
    await input.click();
    await input.fill('Bob');
    const option = section.locator('[cngxOption]').filter({ hasText: 'Bob Schmidt' }).first();
    await option.click();
    // Panel closes.
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    // Input text shows displayWith(value).
    await expect(input).toHaveValue('Bob Schmidt');
    // Value surface reflects the pick.
    await expect(section.locator('.event-row').filter({ hasText: 'Value' })).toContainText('Bob Schmidt');
  });

  test('clearOnBlur=true restores last-committed display when user types stray text', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Typeahead — single-value');
    const input = section.locator('input.cngx-typeahead__input').first();
    // First, commit a real pick.
    await input.click();
    await input.fill('Charlotte');
    const option = section.locator('[cngxOption]').filter({ hasText: 'Charlotte Fischer' }).first();
    await option.click();
    await expect(input).toHaveValue('Charlotte Fischer');
    // Now type stray text without picking.
    await input.click();
    await input.fill('xxxxx');
    // Blur — clearOnBlur should revert.
    await input.blur();
    await expect(input).toHaveValue('Charlotte Fischer');
  });

  test('clearable button appears when a value is set and resets it to undefined', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Typeahead — single-value');
    const input = section.locator('input.cngx-typeahead__input').first();
    // Pick something so the clear button is rendered.
    await input.click();
    await input.fill('Eva');
    const option = section.locator('[cngxOption]').filter({ hasText: 'Eva Wagner' }).first();
    await option.click();
    await expect(input).toHaveValue('Eva Wagner');
    const clearBtn = section.locator('button.cngx-typeahead__clear').first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(input).toHaveValue('');
    await expect(section.locator('.event-row').filter({ hasText: 'Value' })).toContainText('—');
  });
});
