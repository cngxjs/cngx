import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('CngxSelect demo', () => {
  test('standalone: click option updates value + closes popover', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Standalone');
    const trigger = section.locator('cngx-select button').first();
    await trigger.click();
    await section.locator('[cngxOption]').nth(1).click();
    await expect(
      section.locator('.event-row', { hasText: 'Value' }).locator('.event-value'),
    ).toHaveText('green');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Signal Forms: required validation + cngx id', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Signal Forms');
    const select = section.locator('cngx-select').first();
    await expect(select).toHaveAttribute('id', /cngx-.+-input/);
    await expect(
      section.locator('.event-row', { hasText: 'Valid' }).locator('.event-value'),
    ).toHaveText('no');

    const trigger = select.locator('button').first();
    await trigger.click();
    await section.locator('[cngxOption]').nth(0).click();
    await expect(
      section.locator('.event-row', { hasText: 'Valid' }).locator('.event-value'),
    ).toHaveText('yes');
    await expect(
      section.locator('.event-row', { hasText: 'Field value' }).locator('.event-value'),
    ).toHaveText('red');
  });

  test('keyboard typeahead: first-letter jump updates highlight repeatedly', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Standalone');
    const trigger = section.locator('cngx-select button').first();
    await trigger.focus();
    await trigger.click();

    const listbox = section.locator('[cngxListbox]');
    // Wait 350ms between keys so each letter starts a fresh typeahead buffer
    // (300ms debounce + margin) — exercises the "only works once" regression.
    await page.keyboard.press('g');
    await expect(listbox).toHaveAttribute('aria-activedescendant', /cngx-option-\d+/);
    const afterG = await listbox.getAttribute('aria-activedescendant');
    expect(await page.locator(`#${afterG}`).textContent()).toContain('Grün');

    await page.waitForTimeout(350);
    await page.keyboard.press('b');
    const afterB = await listbox.getAttribute('aria-activedescendant');
    expect(afterB).not.toBe(afterG);
    expect(await page.locator(`#${afterB}`).textContent()).toContain('Blau');

    await page.waitForTimeout(350);
    await page.keyboard.press('r');
    const afterR = await listbox.getAttribute('aria-activedescendant');
    expect(await page.locator(`#${afterR}`).textContent()).toContain('Rot');

    await page.keyboard.press('Enter');
    await expect(
      section.locator('.event-row', { hasText: 'Value' }).locator('.event-value'),
    ).toHaveText('red');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('Reactive Forms: initial value shows + select updates FormControl', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Reactive Forms');
    const trigger = section.locator('cngx-select button').first();
    await expect(trigger).toContainText('Grün');

    await trigger.click();
    await section.locator('[cngxOption]').nth(2).click();
    await expect(
      section.locator('.event-row', { hasText: 'RF control value' }).locator('.event-value'),
    ).toHaveText('blue');
  });
});
