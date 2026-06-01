import { expect, test } from '@playwright/test';

const ROUTE = '/#/common/interactive/context-menu/right-click-target-zone';

test.describe('CngxContextMenuTrigger demo', () => {
  test('right-click opens the popover and anchors it at pointer', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.click({ button: 'right' });
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();
    await expect(zone).toHaveAttribute('aria-expanded', 'true');
  });

  test('Shift+F10 opens the popover from keyboard', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.locator('[role="menu"]')).toBeVisible();
  });

  test('Escape closes and restores focus to the zone', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.locator('[role="menu"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="menu"]')).toBeHidden();
    await expect(zone).toBeFocused();
  });

  test('pointerdown outside dismisses the menu', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.click({ button: 'right' });
    await expect(page.locator('[role="menu"]')).toBeVisible();

    await page.locator('h1, body').first().click({ position: { x: 5, y: 5 } });
    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('window blur dismisses the menu', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.click({ button: 'right' });
    await expect(page.locator('[role="menu"]')).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('CngxMenuTrigger (dropdown) backdrop-click dismisses', async ({ page }) => {
    await page.goto('/#/common/interactive/menu/trigger/dropdown-menu');
    const trigger = page.locator('button.trigger');
    await trigger.click();
    await expect(page.locator('[role="menu"]')).toBeVisible();
    await page.locator('h1, body').first().click({ position: { x: 5, y: 5 } });
    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('scroll-dismiss demo: scrolling closes the opt-in menu', async ({ page }) => {
    await page.goto('/#/common/interactive/context-menu/scroll-dismisses-menu');
    const zone = page.locator('.demo-scroll-zone');
    await zone.click({ button: 'right' });
    await expect(page.locator('[role="menu"]')).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    await expect(page.locator('[role="menu"]')).toBeHidden();
  });

  test('Shift+F10 then ArrowDown + Enter activates a menu item', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.locator('[role="menu"]')).toBeVisible();

    await page.keyboard.press('ArrowDown'); // copy -> paste
    await page.keyboard.press('Enter');

    const lastAction = page.locator('.event-row', { hasText: 'Last action' });
    await expect(lastAction.locator('.event-value')).toHaveText('paste');
  });

  test('typeahead jumps to the matching item', async ({ page }) => {
    await page.goto(ROUTE);
    const zone = page.locator('.demo-context-menu-zone');
    await zone.click({ button: 'right' });
    await expect(page.locator('[role="menu"]')).toBeVisible();

    await page.keyboard.press('d'); // jump to "delete"
    await page.keyboard.press('Enter');

    const lastAction = page.locator('.event-row', { hasText: 'Last action' });
    await expect(lastAction.locator('.event-value')).toHaveText('delete');
  });
});
