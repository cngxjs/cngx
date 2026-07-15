import { expect, test } from '@playwright/test';

test.describe('CngxSidenav layout regressions', () => {
  test('rail body does not overflow a non-default-width rail (side mode)', async ({ page }) => {
    await page.goto('/#/ui/sidenav/full-navigation-sidebar');
    const nav = page.locator('cngx-sidenav').first();
    const body = nav.locator('.cngx-sidenav__body');
    await expect(nav).toBeVisible();

    const navBox = await nav.boundingBox();
    const bodyBox = await body.boundingBox();
    expect(navBox).not.toBeNull();
    expect(bodyBox).not.toBeNull();

    // Regression guard: `--cngx-sidenav-width` was a registered @property with
    // `inherits: false`, so the body's `min-width: var(--cngx-sidenav-width)`
    // fell back to the 280px initial and overflowed any non-280 rail (here 240).
    expect(bodyBox!.width).toBeLessThanOrEqual(navBox!.width + 1);
  });

  test('mini rail expands over content without shifting it', async ({ page }) => {
    await page.goto('/#/ui/sidenav/config-hover-dwell');
    const nav = page.locator('cngx-sidenav', { hasText: 'Config' }).first();
    const content = page.locator('cngx-sidenav-content').first();
    await expect(nav).toBeVisible();

    const contentLeftBefore = (await content.boundingBox())!.x;

    // Rest on the rail past the ~250ms scoped dwell so it expands.
    await nav.hover();
    await expect(nav).toHaveClass(/cngx-sidenav--expanded/, { timeout: 2000 });

    const navBox = await nav.boundingBox();
    const contentLeftAfter = (await content.boundingBox())!.x;

    // The rail actually grew past the 56px mini width...
    expect(navBox!.width).toBeGreaterThan(100);
    // ...but the negative-margin overlay means content is not pushed right.
    // Regression guard: cngx gated the overlay margin on `.--mini.--open`, but a
    // mini rail has no `--open`, so it pushed content instead of overlaying.
    expect(Math.abs(contentLeftAfter - contentLeftBefore)).toBeLessThanOrEqual(1);
  });
});
