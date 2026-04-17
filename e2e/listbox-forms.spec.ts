import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/listbox-forms';

function card(page: Page, label: string): Locator {
  return page
    .locator('app-example-card')
    .filter({ has: page.locator(`[aria-label="${label}"]`) });
}

test.describe('CngxListboxFieldBridge demo', () => {
  test('Signal Forms single-select: click pushes value into field', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Lieblingsfarbe');
    const listbox = section.locator('[role="listbox"][aria-label="Lieblingsfarbe"]');
    await listbox.locator('[cngxOption]').nth(1).click();
    await expect(section.locator('.event-row', { hasText: 'Field value' }).locator('.event-value')).toHaveText('green');
    await expect(section.locator('.event-row', { hasText: 'Valid' }).locator('.event-value')).toHaveText('yes');
  });

  test('Signal Forms single-select: empty state is invalid (required)', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Lieblingsfarbe');
    await expect(section.locator('.event-row', { hasText: 'Valid' }).locator('.event-value')).toHaveText('no');
  });

  test('Signal Forms multi-select: picking 2+ toppings satisfies minLength', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Beläge');
    const listbox = section.locator('[role="listbox"][aria-label="Beläge"]');
    await listbox.locator('[cngxOption]').nth(0).click();
    await listbox.locator('[cngxOption]').nth(2).click();
    await expect(section.locator('.event-row', { hasText: 'Field value' }).locator('.event-value')).toContainText('cheese');
    await expect(section.locator('.event-row', { hasText: 'Field value' }).locator('.event-value')).toContainText('mushroom');
    await expect(section.locator('.event-row', { hasText: 'Valid' }).locator('.event-value')).toHaveText('yes');
  });

  test('Reactive Forms: click updates the FormControl', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Farbe (RF)');
    const listbox = section.locator('[role="listbox"][aria-label="Farbe (RF)"]');
    await listbox.locator('[cngxOption]').nth(2).click();
    await expect(section.locator('.event-row', { hasText: 'RF control value' }).locator('.event-value')).toHaveText('blue');
  });

  test('Reactive Forms: initial value flows into listbox', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Farbe (RF)');
    const listbox = section.locator('[role="listbox"][aria-label="Farbe (RF)"]');
    const greenOption = listbox.locator('[cngxOption][value="green"]');
    await expect(greenOption).toHaveAttribute('aria-selected', 'true');
  });
});
