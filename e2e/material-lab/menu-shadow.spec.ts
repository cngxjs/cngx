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
