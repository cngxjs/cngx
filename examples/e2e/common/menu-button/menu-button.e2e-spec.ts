import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMenuButton is the APG menu button on the button core. The button
// keeps focus while the menu is open and drives the menu's active descendant;
// the panel is anchored to the button. The vertical keys do not depend on the
// writing direction, so the pass runs once per direction and also pins that
// the caret sits at the inline end.

const BASIC = 'common/menu-button/menu-button/basic';
const DISABLED = 'common/menu-button/menu-button/disabled-with-reason';

async function setDirection(page: Page, dir: 'ltr' | 'rtl'): Promise<void> {
  await page.evaluate((d) => document.documentElement.setAttribute('dir', d), dir);
}

/** Text of the item the menu currently points at through aria-activedescendant. */
async function activeItem(page: Page, menu: Locator): Promise<string | null> {
  const id = await menu.getAttribute('aria-activedescendant');
  if (!id) {
    return null;
  }
  return (await page.locator(`[id="${id}"]`).textContent())?.trim() ?? null;
}

for (const dir of ['ltr', 'rtl'] as const) {
  test.describe(`common/menu-button/menu-button (${dir})`, () => {
    test('keyboard pass: open, move, activate, close', async ({ page }) => {
      await gotoDemo(page, BASIC);
      await setDirection(page, dir);

      const button = page.getByRole('button', { name: 'Export' });
      const menu = page.getByRole('menu', { name: 'Export format' });
      await expect(button).toHaveAttribute('aria-haspopup', 'menu');
      await expect(button).toHaveAttribute('aria-expanded', 'false');

      // The caret sits at the inline end of the label in both directions.
      const label = await button.locator('.cngx-button__label').boundingBox();
      const caret = await button.locator('.cngx-menu-button__caret').boundingBox();
      expect(label && caret).toBeTruthy();
      if (dir === 'ltr') {
        expect(caret!.x).toBeGreaterThan(label!.x);
      } else {
        expect(caret!.x).toBeLessThan(label!.x);
      }

      await button.focus();
      await page.keyboard.press('ArrowDown');
      await expect(menu).toBeVisible();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(button).toBeFocused();
      await expect.poll(() => activeItem(page, menu)).toBe('PDF');

      // The panel is anchored to the button, not laid out at the page origin.
      const anchorName = await button.evaluate((el) =>
        getComputedStyle(el).getPropertyValue('anchor-name'),
      );
      expect(anchorName).not.toBe('none');

      await page.keyboard.press('End');
      await expect.poll(() => activeItem(page, menu)).toBe('Excel workbook');
      await page.keyboard.press('Home');
      await expect.poll(() => activeItem(page, menu)).toBe('PDF');
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => activeItem(page, menu)).toBe('CSV');
      await page.keyboard.press('ArrowUp');
      await expect.poll(() => activeItem(page, menu)).toBe('PDF');

      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();

      await page.keyboard.press('ArrowUp');
      await expect(menu).toBeVisible();
      await expect.poll(() => activeItem(page, menu)).toBe('Excel workbook');
      await page.keyboard.press('Enter');
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();

      const lastFormat = page
        .locator('.event-row')
        .filter({ has: page.getByText('Last format', { exact: true }) })
        .locator('.event-value');
      await expect(lastFormat).toHaveText('xlsx');
    });

    for (const key of ['Enter', 'Space'] as const) {
      test(`${key} opens a closed menu and it stays open`, async ({ page }) => {
        await gotoDemo(page, BASIC);
        await setDirection(page, dir);

        const button = page.getByRole('button', { name: 'Export' });
        const menu = page.getByRole('menu', { name: 'Export format' });
        await button.focus();
        // keydown opens; the native click a button fires for the same key
        // would toggle it shut, so the menu staying open proves it is suppressed.
        await page.keyboard.press(key);
        await expect(menu).toBeVisible();
        await expect.poll(() => activeItem(page, menu)).toBe('PDF');
        await page.waitForTimeout(100);
        await expect(menu).toBeVisible();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(button).toBeFocused();
      });
    }

    test('click toggles the menu', async ({ page }) => {
      await gotoDemo(page, BASIC);
      await setDirection(page, dir);

      const button = page.getByRole('button', { name: 'Export' });
      const menu = page.getByRole('menu', { name: 'Export format' });
      await button.click();
      await expect(menu).toBeVisible();
      await button.click();
      await expect(menu).toBeHidden();
    });

    test('disabled: opens on nothing and closes an open menu', async ({ page }) => {
      await gotoDemo(page, DISABLED);
      await setDirection(page, dir);

      const button = page.getByRole('button', { name: 'Export' });
      const menu = page.getByRole('menu', { name: 'Export format' });
      const toggle = page.getByRole('button', { name: 'Revoke analyst role' });

      await button.focus();
      await page.keyboard.press('ArrowDown');
      await expect(menu).toBeVisible();
      // A programmatic click fires no pointerdown, so outside-click dismissal
      // stays out of it: only the disabled flip can close the menu here.
      await toggle.evaluate((el: HTMLElement) => el.click());
      await expect(menu).toBeHidden();
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      await expect(button).toHaveAccessibleDescription('Exporting needs the analyst role.');

      // force: Playwright refuses an aria-disabled target; the core must swallow it.
      await button.click({ force: true });
      await expect(menu).toBeHidden();
      await button.focus();
      for (const key of ['ArrowDown', 'ArrowUp', 'Enter', ' ']) {
        await page.keyboard.press(key);
        await expect(menu).toBeHidden();
      }
      await expect(button).toBeFocused();
    });
  });
}
