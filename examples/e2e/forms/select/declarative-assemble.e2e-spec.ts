import type { Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: the declarative option elements hosted in a listbox the consumer
// composes from CngxPopover + CngxListboxTrigger + CngxListbox.
const ROUTE = 'forms/select/declarative/assemble-it-yourself';

const triggerOf = (page: Page) => page.locator('main button.chip');
const listboxOf = (page: Page) => page.getByRole('listbox', { name: 'Color' });
const valueOf = (page: Page) =>
  page.locator('.event-row', { hasText: 'Value' }).locator('.event-value');

test.describe('declarative options in an assembled listbox', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page, ROUTE);
  });

  test('the intro names the listbox atoms, not the CngxSelect organism', async ({ page }) => {
    const intro = page.locator('header.cngx-ex-intro');
    await expect(intro).toContainText('CngxListbox');
    await expect(intro).not.toContainText('CngxSelect - native-feeling single-select');
  });

  test('renders the divider between the two groups', async ({ page }) => {
    await triggerOf(page).click();
    const listbox = listboxOf(page);
    await expect(listbox).toBeVisible();
    const order = await listbox.evaluate((lb) =>
      Array.from(lb.children).map((el) => el.tagName.toLowerCase()),
    );
    expect(order).toEqual(['cngx-optgroup', 'cngx-select-divider', 'cngx-optgroup']);
  });

  test('picks Blue by click', async ({ page }) => {
    await triggerOf(page).click();
    await listboxOf(page).getByRole('option', { name: 'Blue' }).click();
    await expect(valueOf(page)).toHaveText('blue');
  });

  test('picks Blue by keyboard', async ({ page }) => {
    const trigger = triggerOf(page);
    await trigger.focus();
    await trigger.press('Enter');
    await expect(listboxOf(page)).toBeVisible();
    await trigger.press('b');
    await trigger.press('Enter');
    await expect(valueOf(page)).toHaveText('blue');
  });
});
