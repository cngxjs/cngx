import { expect, test } from '@playwright/test';

const SINGLE = '/#/forms/field/listbox-forms/signal-forms-single-select';
const MULTI = '/#/forms/field/listbox-forms/signal-forms-multi-select-min-2';
const RF = '/#/forms/field/listbox-forms/reactive-forms-adapted-via-adaptformcontrol';
const MAT = '/#/forms/field/listbox-forms/material-mat-select-via-cngxbindfield';

test.describe('CngxListboxFieldBridge demo', () => {
  test('Signal Forms single-select: click selects the option and makes the field valid', async ({
    page,
  }) => {
    await page.goto(SINGLE);
    const field = page.locator('cngx-form-field');
    const listbox = page.getByRole('listbox', { name: 'Lieblingsfarbe' });
    const green = listbox.getByRole('option', { name: 'Green' });
    await green.click();
    await expect(green).toHaveAttribute('aria-selected', 'true');
    await expect(listbox.getByRole('option', { name: 'Red' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await expect(field).toHaveClass(/cngx-field--valid/);
    await expect(listbox).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('Signal Forms single-select: empty state is required and invalid', async ({ page }) => {
    await page.goto(SINGLE);
    const field = page.locator('cngx-form-field');
    const listbox = page.getByRole('listbox', { name: 'Lieblingsfarbe' });
    await expect(listbox).toHaveAttribute('aria-required', 'true');
    await expect(field).toHaveClass(/cngx-field--required/);
    await expect(field).not.toHaveClass(/cngx-field--valid/);
    await expect(listbox.locator('[aria-selected="true"]')).toHaveCount(0);
  });

  test('Signal Forms multi-select: picking 2+ toppings satisfies minLength', async ({ page }) => {
    await page.goto(MULTI);
    const field = page.locator('cngx-form-field');
    const listbox = page.getByRole('listbox', { name: /^Toppings/ });
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    const cheese = listbox.getByRole('option', { name: 'Cheese' });
    const mushroom = listbox.getByRole('option', { name: 'Mushroom' });

    await cheese.click();
    await expect(cheese).toHaveAttribute('aria-selected', 'true');
    await expect(field).not.toHaveClass(/cngx-field--valid/);

    await mushroom.click();
    await expect(cheese).toHaveAttribute('aria-selected', 'true');
    await expect(mushroom).toHaveAttribute('aria-selected', 'true');
    await expect(field).toHaveClass(/cngx-field--valid/);
  });

  test('Reactive Forms: click moves the selection and keeps the field valid', async ({ page }) => {
    await page.goto(RF);
    const field = page.locator('cngx-form-field');
    const listbox = page.getByRole('listbox', { name: 'Color (RF)' });
    const blue = listbox.getByRole('option', { name: 'Blue' });
    await blue.click();
    await expect(blue).toHaveAttribute('aria-selected', 'true');
    await expect(listbox.getByRole('option', { name: 'Green' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    await expect(field).toHaveClass(/cngx-field--valid/);
  });

  test('Reactive Forms: initial value flows into listbox', async ({ page }) => {
    await page.goto(RF);
    const listbox = page.getByRole('listbox', { name: 'Color (RF)' });
    await expect(listbox.getByRole('option', { name: 'Green' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('mat-select via CngxBindField: select option updates field + ARIA', async ({ page }) => {
    await page.goto(MAT);
    const field = page.locator('cngx-form-field');

    // The mat-select receives the cngx-form-field-generated ID
    const matSelect = page.locator('mat-select');
    await expect(matSelect).toHaveAttribute('id', 'cngx-size-input');
    await expect(matSelect).toHaveAttribute('aria-required', 'true');
    await expect(field).toHaveClass(/cngx-field--required/);
    await expect(field).not.toHaveClass(/cngx-field--valid/);

    // Open the panel and pick "Medium"
    await matSelect.click();
    await page.getByRole('option', { name: 'Medium' }).click();

    await expect(matSelect).toContainText('Medium');
    await expect(field).toHaveClass(/cngx-field--valid/);
    await expect(matSelect).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('mat-select via CngxBindField: empty + touched shows field-errors', async ({ page }) => {
    await page.goto(MAT);

    await page.getByRole('button', { name: 'Touch' }).click();
    await expect(page.locator('cngx-form-field')).toHaveClass(/cngx-field--error/);
    await expect(page.locator('cngx-field-errors')).not.toBeEmpty();
    await expect(page.locator('mat-select')).toHaveAttribute('aria-invalid', 'true');
  });
});
