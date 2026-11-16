import { expect, test } from '../_test';
import { gotoDemo } from '../_helpers';
import { routesUnder } from '../_routes';

// Stories under ui/nav-rail: the icon rail with its rail tooltip, the group
// flyout and the end-side rail.

test.describe('ui/nav-rail', () => {
  for (const { name, path } of routesUnder('ui', 'nav-rail')) {
    test(`${name}: renders`, async ({ page }) => {
      await gotoDemo(page, path);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      await expect(page.locator('cngx-nav-rail')).toBeVisible();
    });
  }

  test('labels-beside: a focused row shows its label in the rail tooltip', async ({ page }) => {
    await gotoDemo(page, 'ui/nav-rail/labels-beside');
    const rail = page.locator('cngx-nav-rail');
    await rail.getByRole('link', { name: /Calendar/ }).focus();

    const tip = page.locator('.cngx-nav-rail-tooltip');
    await expect(tip).toHaveText('Calendar');
    expect(await tip.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    await expect(tip).toHaveAttribute('aria-hidden', 'true');
  });

  test('labels-beside: the Reports group opens as a flyout and Escape returns focus to its head', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/nav-rail/labels-beside');
    const rail = page.locator('cngx-nav-rail');
    const head = rail.getByRole('button', { name: 'Reports' });
    const content = rail.locator('.cngx-nav-group-content');

    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => content.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    await expect(content.getByRole('link', { name: 'Weekly' })).toBeVisible();

    await content.getByRole('link', { name: 'Weekly' }).focus();
    await page.keyboard.press('Escape');
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => content.evaluate((el) => el.matches(':popover-open'))).toBe(false);
    await expect(head).toBeFocused();
  });

  test('end-side: the flyout opens toward the inline start of an end rail', async ({ page }) => {
    await gotoDemo(page, 'ui/nav-rail/end-side');
    const rail = page.locator('cngx-nav-rail');
    const head = rail.getByRole('button', { name: 'Reports' });
    const content = rail.locator('.cngx-nav-group-content');

    await head.click();
    await expect.poll(() => content.evaluate((el) => el.matches(':popover-open'))).toBe(true);
    const headBox = await head.boundingBox();
    const flyoutBox = await content.boundingBox();
    expect(headBox).not.toBeNull();
    expect(flyoutBox).not.toBeNull();
    expect(flyoutBox!.x + flyoutBox!.width).toBeLessThanOrEqual(headBox!.x + 1);
  });
});
