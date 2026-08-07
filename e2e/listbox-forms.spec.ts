import { expect, test } from '@playwright/test';

const SINGLE = '/#/forms/field/listbox-forms/signal-forms-single-select';
const MULTI = '/#/forms/field/listbox-forms/signal-forms-multi-select-min-2';
const RF = '/#/forms/field/listbox-forms/reactive-forms-adapted-via-adaptformcontrol';
const MAT = '/#/forms/field/listbox-forms/material-mat-select-via-cngxbindfield';

test.describe('CngxListboxFieldBridge demo', () => {
  test('Signal Forms single-select: click pushes value into field', async ({ page }) => {
    await page.goto(SINGLE);
    const listbox = page.locator('[role="listbox"][aria-label="Lieblingsfarbe"]');
    await listbox.locator('[cngxOption]').nth(1).click();
    await expect(page.locator('.event-row', { hasText: 'Field value' }).locator('.event-value')).toHaveText('green');
    await expect(page.locator('.event-row', { hasText: 'Valid' }).locator('.event-value')).toHaveText('yes');
  });

  test('Signal Forms single-select: empty state is invalid (required)', async ({ page }) => {
    await page.goto(SINGLE);
    await expect(page.locator('.event-row', { hasText: 'Valid' }).locator('.event-value')).toHaveText('no');
  });

  test('Signal Forms multi-select: picking 2+ toppings satisfies minLength', async ({ page }) => {
    await page.goto(MULTI);
    const listbox = page.locator('[role="listbox"][aria-label="Toppings"]');
    await listbox.locator('[cngxOption]').nth(0).click();
    await listbox.locator('[cngxOption]').nth(2).click();
    await expect(page.locator('.event-row', { hasText: 'Field value' }).locator('.event-value')).toContainText('cheese');
    await expect(page.locator('.event-row', { hasText: 'Field value' }).locator('.event-value')).toContainText('mushroom');
    await expect(page.locator('.event-row', { hasText: 'Valid' }).locator('.event-value')).toHaveText('yes');
  });

  test('Reactive Forms: click updates the FormControl', async ({ page }) => {
    await page.goto(RF);
    const listbox = page.locator('[role="listbox"][aria-label="Color (RF)"]');
    await listbox.locator('[cngxOption]').nth(2).click();
    await expect(page.locator('.event-row', { hasText: 'RF control value' }).locator('.event-value')).toHaveText('blue');
  });

  test('Reactive Forms: initial value flows into listbox', async ({ page }) => {
    await page.goto(RF);
    const listbox = page.locator('[role="listbox"][aria-label="Color (RF)"]');
    const greenOption = listbox.locator('[cngxOption][value="green"]');
    await expect(greenOption).toHaveAttribute('aria-selected', 'true');
  });

  test('mat-select via CngxBindField: select option updates field + ARIA', async ({ page }) => {
    await page.goto(MAT);

    // Initial state: empty → invalid (required)
    await expect(
      page.locator('.event-row', { hasText: 'mat-select value' }).locator('.event-value'),
    ).toHaveText('—');

    // The mat-select receives the cngx-form-field-generated ID
    const matSelect = page.locator('mat-select');
    await expect(matSelect).toHaveAttribute('id', 'cngx-size-input');
    await expect(matSelect).toHaveAttribute('aria-required', 'true');

    // Open the panel and pick "Medium"
    await matSelect.click();
    await page.locator('mat-option', { hasText: 'Medium' }).click();

    await expect(
      page.locator('.event-row', { hasText: 'mat-select value' }).locator('.event-value'),
    ).toHaveText('m');
    await expect(
      page.locator('.event-row', { hasText: 'Valid' }).locator('.event-value'),
    ).toHaveText('yes');
  });

  test('mat-select via CngxBindField: empty + touched shows field-errors', async ({ page }) => {
    await page.goto(MAT);

    await page.locator('button.chip', { hasText: 'Touch' }).click();
    await expect(page.locator('cngx-field-errors')).toBeVisible();
    await expect(page.locator('mat-select')).toHaveAttribute('aria-invalid', 'true');
  });
});
