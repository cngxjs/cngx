import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('CngxSelect demo', () => {
  test('standalone single-select: click option updates value + closes popover', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Standalone — single-select');
    const trigger = section.locator('cngx-select button').first();
    await trigger.click();
    await section.locator('[cngxOption]').nth(1).click();
    await expect(
      section.locator('.event-row', { hasText: 'Value' }).locator('.event-value'),
    ).toHaveText('green');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('standalone multi-select: clicks accumulate and popover stays open', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Standalone — multi-select');
    const trigger = section.locator('cngx-select button').first();
    await trigger.click();
    await section.locator('[cngxOption]').nth(0).click();
    await section.locator('[cngxOption]').nth(2).click();
    await expect(
      section.locator('.event-row', { hasText: 'Selected' }).locator('.event-value'),
    ).toContainText('cheese');
    await expect(
      section.locator('.event-row', { hasText: 'Selected' }).locator('.event-value'),
    ).toContainText('mushroom');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('Signal Forms single: required validation + cngx id', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Signal Forms — single select (required)');
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

  test('Reactive Forms: initial value shows + select updates FormControl', async ({
    page,
  }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Reactive Forms — adapted via adaptFormControl');
    const trigger = section.locator('cngx-select button').first();
    await expect(trigger).toContainText('Grün');

    await trigger.click();
    await section.locator('[cngxOption]').nth(2).click();
    await expect(
      section.locator('.event-row', { hasText: 'RF control value' }).locator('.event-value'),
    ).toHaveText('blue');
  });
});
