import { expect, test } from '@playwright/test';

test.describe('field error basic story', () => {
  test('keeps the manual error slot empty until the field is touched', async ({ page }) => {
    await page.goto('/#/forms/field/error/basic');
    const input = page.getByRole('textbox', { name: 'Username' });
    const slot = page.locator('main .cngx-error');

    await expect(input).toBeVisible();
    await expect(slot).toBeAttached();
    await expect(slot).toHaveText('');

    await input.focus();
    await input.blur();
    await expect(slot).toContainText('Username is required');
    await expect(slot).toHaveAttribute('role', 'alert');
  });
});

// Same contract for every manual-slot story: nothing at rest, the message
// after the first blur. The input is found by its accessible name, so the
// label wiring is part of the contract. `scope` narrows the page when two
// fields share a label.
const MANUAL_SLOT_STORIES = [
  { route: 'icons-per-kind', scope: 'main', label: 'Email address', message: 'Email is required' },
  {
    route: 'when-to-pick-manual-vs-auto',
    scope: 'main section:has(> h3:text-is("Manual: div cngxError"))',
    label: 'Display name',
    message: 'This field is required',
  },
  { route: 'server-injected-error', scope: 'main', label: 'Email address', message: 'Email is required' },
] as const;

for (const story of MANUAL_SLOT_STORIES) {
  test.describe(`field error ${story.route} story`, () => {
    test('keeps the manual error slot empty until the field is touched', async ({ page }) => {
      await page.goto(`/#/forms/field/error/${story.route}`);
      const field = page
        .locator(story.scope)
        .locator('cngx-form-field', { has: page.getByRole('textbox', { name: story.label }) });
      const input = field.getByRole('textbox', { name: story.label });
      const slot = field.locator('.cngx-error');

      await expect(input).toBeVisible();
      await expect(slot).toBeAttached();
      await expect(slot).toHaveText('');

      await input.focus();
      await input.blur();
      await expect(slot).toContainText(story.message);
    });
  });
}
test.describe('field error server-injected-error story reset', () => {
  test('clears the touched state, so the slot is empty again after Reset', async ({ page }) => {
    await page.goto('/#/forms/field/error/server-injected-error');
    const field = page.locator('main cngx-form-field', {
      has: page.getByRole('textbox', { name: 'Email address' }),
    });
    const input = field.getByRole('textbox', { name: 'Email address' });
    const slot = field.locator('.cngx-error');

    await input.focus();
    await input.blur();
    await expect(slot).toContainText('Email is required');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(slot).toHaveText('');
  });
});
