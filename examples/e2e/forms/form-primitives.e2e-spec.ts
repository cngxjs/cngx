import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesIn } from '../_routes';

/** The `cngx-form-field` whose `cngxLabel` reads exactly `label`. */
function fieldLabelled(page: Page, label: string): Locator {
  return page
    .locator('cngx-form-field')
    .filter({ has: page.locator('[cngxLabel]', { hasText: new RegExp(`^\\s*${label}\\s*$`) }) });
}

test.describe('forms/field/form-primitives', () => {
  for (const { name, path } of routesIn('forms', 'field', 'form-primitives')) {
    test(`${name}: the field projects required and label onto the discovered atom`, async ({
      page,
    }) => {
      await gotoDemo(page, path);
      const terms = fieldLabelled(page, 'Terms');
      const checkbox = terms.getByRole('checkbox');
      await expect(terms).toHaveClass(/cngx-field--required/);
      await expect(terms).not.toHaveClass(/cngx-field--valid/);
      await expect(checkbox).toHaveAttribute('aria-required', 'true');
      await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      await expect(checkbox).not.toHaveAttribute('aria-invalid', 'true');
      const labelId = await terms.locator('[cngxLabel]').getAttribute('id');
      expect(labelId).toBeTruthy();
      await expect(checkbox).toHaveAttribute('aria-labelledby', new RegExp(`\\b${labelId}\\b`));

      const payment = fieldLabelled(page, 'Payment method');
      await expect(payment.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    });

    test(`${name}: touched and empty marks the atoms invalid and renders the errors`, async ({
      page,
    }) => {
      await gotoDemo(page, path);
      await page.getByRole('button', { name: /^Validate/ }).click();

      const terms = fieldLabelled(page, 'Terms');
      await expect(terms).toHaveClass(/cngx-field--error/);
      await expect(terms.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
      await expect(terms.locator('cngx-field-errors')).not.toBeEmpty();

      const payment = fieldLabelled(page, 'Payment method');
      await expect(payment).toHaveClass(/cngx-field--error/);
      await expect(payment.locator('cngx-field-errors')).not.toBeEmpty();
    });

    test(`${name}: picking a value makes the field valid and clears its error`, async ({
      page,
    }) => {
      await gotoDemo(page, path);
      await page.getByRole('button', { name: /^Validate/ }).click();

      const terms = fieldLabelled(page, 'Terms');
      const checkbox = terms.getByRole('checkbox');
      await checkbox.click();
      await expect(checkbox).toHaveAttribute('aria-checked', 'true');
      await expect(terms).toHaveClass(/cngx-field--valid/);
      await expect(terms).not.toHaveClass(/cngx-field--error/);
      await expect(checkbox).not.toHaveAttribute('aria-invalid', 'true');

      const payment = fieldLabelled(page, 'Payment method');
      const radio = payment.getByRole('radio').first();
      await radio.click();
      await expect(radio).toHaveAttribute('aria-checked', 'true');
      await expect(payment).toHaveClass(/cngx-field--valid/);
      await expect(payment).not.toHaveClass(/cngx-field--error/);
    });
  }
});
