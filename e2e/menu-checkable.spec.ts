import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/menu-checkable';

test.describe('CngxMenuItemCheckbox + CngxMenuItemRadio demo', () => {
  test('renders initial aria-checked state', async ({ page }) => {
    await page.goto(ROUTE);
    const bold = page.locator('[role="menuitemcheckbox"]').nth(0);
    await expect(bold).toHaveAttribute('aria-checked', 'true');
    const italic = page.locator('[role="menuitemcheckbox"]').nth(1);
    await expect(italic).toHaveAttribute('aria-checked', 'false');
  });

  test('click on checkbox toggles checked', async ({ page }) => {
    await page.goto(ROUTE);
    const italic = page.locator('[role="menuitemcheckbox"]').nth(1);
    await italic.click();
    await expect(italic).toHaveAttribute('aria-checked', 'true');
    await italic.click();
    await expect(italic).toHaveAttribute('aria-checked', 'false');
  });

  test('radio group enforces mutual exclusion', async ({ page }) => {
    await page.goto(ROUTE);
    const radios = page.locator('[role="menuitemradio"]');
    await radios.nth(0).click();
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'false');
    await radios.nth(2).click();
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'false');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
  });

  test('group element has role="group" and aria-label', async ({ page }) => {
    await page.goto(ROUTE);
    const group = page.locator('[role="group"]');
    await expect(group).toHaveAttribute('aria-label', 'Alignment');
  });
});
