import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

/**
 * Functional smoke over every `forms/field` story: typing into a field's text
 * control reaches the bound field, and a Reset button clears the errors and
 * the touched state a Validate / Submit button revealed. A story whose input
 * is not bound with `[formField]` never turns dirty, so it fails here instead
 * of shipping a demo that ignores what the user types.
 */

const TEXT_CONTROL =
  'input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]):not([type=file]), textarea';

function valueFor(type: string | null): string {
  switch (type) {
    case 'email':
      return 'a@b.at';
    case 'number':
      return '42';
    case 'tel':
      return '+43 660 1234567';
    case 'password':
      return 'Secret-123x!';
    default:
      return 'Example 1234';
  }
}

async function editableTextControl(field: Locator): Promise<Locator | null> {
  const control = field.locator(TEXT_CONTROL).first();
  if ((await control.count()) === 0) {
    return null;
  }
  if (!(await control.isVisible()) || !(await control.isEditable())) {
    return null;
  }
  return control;
}

function fieldsWithState(page: Page, state: 'error' | 'touched'): Locator {
  return page.locator(`cngx-form-field.cngx-field--${state}`);
}

test.describe('forms/field stories', () => {
  for (const { name, path } of routesUnder('forms', 'field')) {
    test(`${name}: typing reaches the bound field`, async ({ page }) => {
      await gotoDemo(page, path);
      const fields = page.locator('cngx-form-field');
      const count = await fields.count();
      for (let i = 0; i < count; i++) {
        const field = fields.nth(i);
        const control = await editableTextControl(field);
        if (!control) {
          continue;
        }
        await control.fill('');
        await control.pressSequentially(valueFor(await control.getAttribute('type')));
        await control.blur();
        await expect(field, `field ${i} on ${name} did not turn dirty`).toHaveClass(
          /cngx-field--dirty/,
        );
      }
    });

    test(`${name}: Reset clears what Validate revealed`, async ({ page }) => {
      await gotoDemo(page, path);
      const reveal = page
        .getByRole('button', { name: /^(validate|submit|touch|mark|check)/i })
        .first();
      const reset = page.getByRole('button', { name: /^reset$/i }).first();
      test.skip(
        (await reveal.count()) === 0 || (await reset.count()) === 0,
        'no Validate / Reset pair',
      );

      await reveal.click();
      await expect(fieldsWithState(page, 'error').first()).toBeVisible();

      await reset.click();
      await expect(fieldsWithState(page, 'error')).toHaveCount(0);
      await expect(fieldsWithState(page, 'touched')).toHaveCount(0);
      await expect(page.locator('cngx-form-errors li')).toHaveCount(0);
    });
  }
});
