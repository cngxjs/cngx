import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxAutofocus reacts to a signal — focus jumps to the host the
// moment the input flips to true (or when the host is inserted into the
// DOM with the input already true).

test.describe('common/a11y/autofocus', () => {
  test('focus-on-insert: input is focused when toggled into the view', async ({ page }) => {
    await gotoDemo(page, 'common/a11y/autofocus/focus-on-insert');

    const trigger = page.getByRole('button', { name: 'Show Search' });
    await expect(trigger).toBeVisible();
    // Search input must not yet be in the DOM.
    await expect(page.getByPlaceholder('Search...')).toHaveCount(0);

    await trigger.click();
    const input = page.getByPlaceholder('Search...');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

  });

  test('conditional-focus: flipping the condition pulls focus to a persistent input', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/a11y/autofocus/conditional-focus');

    const trigger = page.getByRole('button', { name: 'Activate Field' });
    const input = page.getByPlaceholder('Focused when active');

    // Input is always in the DOM, but not yet focused.
    await expect(input).toBeVisible();
    await expect(input).not.toBeFocused();

    await trigger.click();
    await expect(input).toBeFocused();

    const condition = page
      .locator('.event-row')
      .filter({ has: page.getByText('Condition', { exact: true }) })
      .locator('.event-value');
    await expect(condition).toHaveText('true');

  });
});
