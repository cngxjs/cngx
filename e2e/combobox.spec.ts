import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/select';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('CngxCombobox demo', () => {
  test('basic: role="combobox" on input, role="group" on wrapper — no nested buttons', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Combobox — basic');
    const input = section.locator('input.cngx-combobox__input').first();
    await expect(input).toHaveAttribute('role', 'combobox');
    const wrapper = section.locator('.cngx-combobox__trigger').first();
    await expect(wrapper).toHaveAttribute('role', 'group');
    // No nested <button> inside <button> — chip × lives in the div
    // wrapper, not in a nested button.
    const nested = section.locator('button button');
    await expect(nested).toHaveCount(0);
  });

  test('typing filters options and toggles aria-expanded', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Combobox — basic');
    const wrapper = section.locator('.cngx-combobox__trigger').first();
    const input = section.locator('input.cngx-combobox__input').first();
    await wrapper.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await input.fill('sig');
    const visibleRows = section.locator('[cngxOption]');
    await expect(visibleRows).toHaveCount(1);
    await expect(visibleRows.first()).toContainText('Signals');
  });

  test('clicking an option adds a chip, panel stays open', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Combobox — basic');
    const wrapper = section.locator('.cngx-combobox__trigger').first();
    const input = section.locator('input.cngx-combobox__input').first();
    await wrapper.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const chipsBefore = await section.locator('cngx-chip').count();

    // 'Signals' is the 2nd option; preload is just 'Angular'.
    const option = section.locator('[cngxOption]').filter({ hasText: 'Signals' }).first();
    await option.click();

    await expect(section.locator('cngx-chip')).toHaveCount(chipsBefore + 1);
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('Backspace on empty input removes the trailing chip', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Combobox — basic');
    const wrapper = section.locator('.cngx-combobox__trigger').first();
    const input = section.locator('input.cngx-combobox__input').first();
    await wrapper.click();
    await input.fill('');
    const chipsBefore = await section.locator('cngx-chip').count();
    expect(chipsBefore).toBeGreaterThan(0);
    await input.press('Backspace');
    await expect(section.locator('cngx-chip')).toHaveCount(chipsBefore - 1);
  });

  test('click outside the trigger closes the panel', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Combobox — basic');
    const wrapper = section.locator('.cngx-combobox__trigger').first();
    const input = section.locator('input.cngx-combobox__input').first();
    await wrapper.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    // Click far outside, above the fold on the page body.
    await page.locator('body').click({ position: { x: 20, y: 20 } });
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('skipInitial + searchTermChange: last-term row never shows the hydrate-time empty', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Combobox — async');
    // On mount, Last term stays '—' because skipInitial drops the first emit.
    const lastTermRow = section
      .locator('.event-row', { hasText: 'Last term' })
      .locator('.event-value');
    await expect(lastTermRow).toHaveText('—');

    // Load options so the filter has something to match.
    await section.getByRole('button', { name: 'Set success' }).click();

    const wrapper = section.locator('.cngx-combobox__trigger').first();
    const input = section.locator('input.cngx-combobox__input').first();
    await wrapper.click();
    await input.fill('sig');
    await expect(lastTermRow).toHaveText('sig');
  });
});
