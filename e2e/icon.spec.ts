import { expect, test } from '@playwright/test';

test.describe('CngxIcon demo', () => {
  test('renders size variants with proper classes', async ({ page }) => {
    await page.goto('/#/common/display/icon/sizes');
    const icons = page.locator('.cngx-ex-artifact cngx-icon');
    await expect(icons).toHaveCount(5);
    await expect(icons.nth(0)).toHaveClass(/cngx-icon--xs/);
    await expect(icons.nth(2)).toHaveClass(/cngx-icon--md/);
    await expect(icons.nth(4)).toHaveClass(/cngx-icon--xl/);

    // The size input reflects as a host attribute too, not only as the
    // modifier class the assertions above cover.
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
      await expect(page.locator(`cngx-icon[size="${size}"]`)).toHaveCount(1);
    }

    // Every size projects its content; a broken projection would still
    // pass the class and attribute checks.
    for (let i = 0; i < 5; i++) {
      await expect(icons.nth(i)).toContainText('★');
    }
  });

  test('decorative icon has aria-hidden, no role', async ({ page }) => {
    await page.goto('/#/common/display/icon/decorative-vs-informative');
    const decorative = page.locator('.cngx-ex-artifact cngx-icon').nth(0);
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role', /.*/);
  });

  test('labeled icon gets role="img" and aria-label', async ({ page }) => {
    await page.goto('/#/common/display/icon/decorative-vs-informative');
    const labeled = page.locator('cngx-icon[aria-label="Saved"]');
    await expect(labeled).toHaveAttribute('role', 'img');
    await expect(labeled).toHaveAttribute('aria-label', 'Saved');
  });
});
