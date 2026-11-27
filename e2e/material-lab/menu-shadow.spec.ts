import { expect, test } from '@playwright/test';

// mat-menu paints the MDC elevation 2 literal (`elevation.get-box-shadow(2)` in
// `_m3-menu.scss`), not --mat-sys-level2, and the two measure differently. The
// cngxMenu dropdown has to paint the same shadow on the menu, and its popover
// wrapper none, or the lift doubles up.
for (const scheme of ['light', 'dark'] as const) {
  test(`menu buttons: the cngxMenu dropdown paints the mat-menu shadow (${scheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#/material-lab');
    // The lab links its theme bundle at runtime: read nothing before it is parsed.
    await page.waitForFunction(() =>
      Array.from(document.styleSheets).some((sheet) =>
        sheet.href?.endsWith('/material-lab-theme.css'),
      ),
    );

    const matPanel = '.mat-mdc-menu-panel';
    await page.locator('#menu-buttons [mat-flat-button]').click();
    await expect(page.locator(matPanel)).toBeVisible();
    const matShadow = await page
      .locator(matPanel)
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(matShadow).not.toBe('none');
    await page.keyboard.press('Escape');
    await expect(page.locator(matPanel)).toHaveCount(0);

    await page.locator('#menu-buttons [cngxMenuButton][tone="primary"]').first().click();
    const wrapper = page.locator('[cngxPopover]:popover-open');
    const menu = wrapper.locator("ul[cngxMenu][aria-label='Export format']");
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS('box-shadow', matShadow);
    await expect(wrapper).toHaveCSS('box-shadow', 'none');
  });
}

// mat-menu paints its divider in surface-variant (`menu-divider-color` in
// `_m3-menu.scss`); the cngxMenu separator takes the same role. Light only:
// the two roles resolve equal in the dark scheme, so a dark pin proves nothing.
test('menu buttons: the cngxMenu separator paints the mat-menu divider role', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/#/material-lab');
  await page.waitForFunction(() =>
    Array.from(document.styleSheets).some((sheet) =>
      sheet.href?.endsWith('/material-lab-theme.css'),
    ),
  );

  await page.locator("#menu-buttons [cngxIconMenuButton][aria-label='More actions']").click();
  const separator = page.locator("[cngxPopover]:popover-open ul[cngxMenu] [cngxMenuSeparator]");
  await expect(separator).toBeVisible();
  const expected = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.background = 'var(--mat-sys-surface-variant)';
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(expected).not.toBe('rgba(0, 0, 0, 0)');
  await expect(separator).toHaveCSS('background-color', expected);
});
