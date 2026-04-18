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

    await page.waitForTimeout(500);
    await page.keyboard.press('b');
    const afterB = await listbox.getAttribute('aria-activedescendant');
    expect(afterB).not.toBe(afterG);
    expect(await page.locator(`#${afterB}`).textContent()).toContain('Blau');

    await page.waitForTimeout(500);
    await page.keyboard.press('r');
    const afterR = await listbox.getAttribute('aria-activedescendant');
    expect(await page.locator(`#${afterR}`).textContent()).toContain('Rot');

    await page.keyboard.press('Enter');
    await expect(
      section.locator('.event-row', { hasText: 'Value' }).locator('.event-value'),
    ).toHaveText('red');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('click-outside closes the panel', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Standalone');
    const trigger = section.locator('cngx-select button').first();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Click far outside — on the page body above the fold
    await page.locator('body').click({ position: { x: 20, y: 20 } });
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

  test('async state: loading shows spinner, success shows options', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Async state consumer');
    const trigger = section.locator('cngx-select button').first();

    await section.getByRole('button', { name: 'loading' }).click();
    await trigger.click();
    await expect(section.locator('.cngx-select__spinner')).toBeVisible();

    await section.getByRole('button', { name: 'success', exact: true }).click();
    await expect(section.locator('.cngx-select__spinner')).toHaveCount(0);
    await expect(section.locator('[cngxOption]')).toHaveCount(4);
  });

  test('async state: error panel invokes retry callback', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Async state consumer');
    const trigger = section.locator('cngx-select button').first();

    await section.getByRole('button', { name: 'error' }).click();
    await trigger.click();
    await expect(section.getByText(/Laden fehlgeschlagen/)).toBeVisible();

    await section.getByRole('button', { name: 'Erneut laden' }).click();
    await expect(
      section.locator('.event-row', { hasText: 'Reload calls' }).locator('.event-value'),
    ).toHaveText('1');
  });

  test('async state: refreshing shows top-bar while options stay visible', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Async state consumer');
    const trigger = section.locator('cngx-select button').first();

    await section.getByRole('button', { name: 'refreshing' }).click();
    await trigger.click();
    await expect(section.locator('.cngx-select__refreshing')).toBeVisible();
    await expect(section.locator('[cngxOption]')).toHaveCount(4);
  });

  test('typeahead-while-closed commits a value without opening the panel', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Standalone');
    const trigger = section.locator('cngx-select button').first();
    await trigger.focus();

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('g');
    // Panel must stay closed AND the value must have changed to the first G match
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(
      section.locator('.event-row', { hasText: 'Value' }).locator('.event-value'),
    ).toHaveText('green');
  });
});
