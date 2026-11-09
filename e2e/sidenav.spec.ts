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

  test('a collapsed rail peeks over content without shifting it', async ({ page }) => {
    await page.goto('/#/ui/sidenav/config-hover-dwell');
    const nav = page.locator('cngx-sidenav', { hasText: 'Config' }).first();
    const content = page.locator('cngx-sidenav-content').first();
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'rail');

    const contentLeftBefore = (await content.boundingBox())!.x;

    // Rest on the rail past the ~250ms scoped dwell so it peeks.
    await nav.hover();
    await expect(nav).toHaveAttribute('data-sidebar-state', 'peek', { timeout: 2000 });

    const navBox = await nav.boundingBox();
    const contentLeftAfter = (await content.boundingBox())!.x;

    // The rail actually grew past the 56px rail width...
    expect(navBox!.width).toBeGreaterThan(100);
    // ...but the sidebar's negative margin means content is not pushed right.
    expect(Math.abs(contentLeftAfter - contentLeftBefore)).toBeLessThanOrEqual(1);
  });

  test('Tab skips the links of a collapsed animated nav group', async ({ page }) => {
    await page.goto('/#/ui/sidenav/full-navigation-sidebar');
    const team = page.getByRole('button', { name: 'Team' });
    const members = page.locator('#team-items').getByText('Members');
    await expect(team).toHaveAttribute('aria-expanded', 'false');

    await team.focus();
    await page.keyboard.press('Tab');
    const focusedInCollapsedGroup = await page.evaluate(
      () => (document.activeElement?.closest('#team-items') ?? null) !== null,
    );
    expect(focusedInCollapsedGroup).toBe(false);
    await expect(members).not.toBeFocused();

    await team.focus();
    await page.keyboard.press('Enter');
    await expect(team).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(members).toBeFocused();
  });

  test('a nav group closing around focus hands focus to its trigger', async ({ page }) => {
    await page.goto('/#/ui/sidenav/full-navigation-sidebar');
    const team = page.getByRole('button', { name: 'Team' });
    const members = page.locator('#team-items').getByText('Members');

    await team.click();
    await expect(team).toHaveAttribute('aria-expanded', 'true');
    await members.focus();
    await expect(members).toBeFocused();

    // A programmatic close (no pointer or key on the trigger) is the case
    // where inert would otherwise drop focus to <body>.
    await team.evaluate((el) => {
      const ngApi = (
        window as unknown as {
          ng: { getDirectives: (node: Element) => { constructor: { name: string } }[] };
        }
      ).ng;
      const disclosure = ngApi
        .getDirectives(el)
        .find((d) => typeof (d as { close?: unknown }).close === 'function') as
        | { close: () => void }
        | undefined;
      disclosure!.close();
    });
    await expect(team).toHaveAttribute('aria-expanded', 'false');
    await expect(team).toBeFocused();
  });
});
