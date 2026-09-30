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
// after the first blur.
const MANUAL_SLOT_STORIES = [
  { route: 'icons-per-kind', input: '#kind-email', message: 'Email is required' },
  { route: 'when-to-pick-manual-vs-auto', input: '#pick-manual-name', message: 'This field is required' },
  { route: 'server-injected-error', input: '#server-email', message: 'Email is required' },
] as const;

for (const story of MANUAL_SLOT_STORIES) {
  test.describe(`field error ${story.route} story`, () => {
    test('keeps the manual error slot empty until the field is touched', async ({ page }) => {
      await page.goto(`/#/forms/field/error/${story.route}`);
      const field = page.locator('main cngx-form-field', { has: page.locator(story.input) });
      const input = field.locator(story.input);
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
    const field = page.locator('main cngx-form-field', { has: page.locator('#server-email') });
    const input = field.locator('#server-email');
    const slot = field.locator('.cngx-error');

    await input.focus();
    await input.blur();
    await expect(slot).toContainText('Email is required');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(slot).toHaveText('');
  });
});
