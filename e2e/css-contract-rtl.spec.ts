import { expect, test, type Page } from '@playwright/test';

// Full-page RTL contracts. A component-isolated unit spec renders LTR; only a
// real page with dir="rtl" exercises the logical-property layout flip. The
// paginator lays its segments out on the inline axis with logical properties
// alone, so dir="rtl" must mirror the whole run with no second rule.
//
// The timeline horizontal run's RTL reversal is already covered in
// e2e/timeline-layout.spec.ts ('dir="rtl" reverses the run with the rail
// geometry intact'), so this file adds the paginator nav row.

const PAGINATOR = '/#/ui/paginator/paginator-skins/numbered';

function buttonLefts(page: Page): Promise<number[]> {
  return page
    .locator('.cngx-ex-artifact .cngx-paginator__button')
    .evaluateAll((btns) => btns.map((b) => Math.round(b.getBoundingClientRect().left)));
}

test.describe('css-contract: RTL paginator nav row mirrors on the inline axis', () => {
  test('dir="rtl" reverses the button run without a second rule', async ({ page }) => {
    await page.goto(PAGINATOR);
    // Wide enough that no @container collapse tier fires - the run is intact.
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('cngx-paginator')).toBeVisible();

    const ltr = await buttonLefts(page);
    expect(ltr.length).toBeGreaterThan(1);
    // LTR: the DOM order runs left-to-right.
    expect(ltr).toEqual([...ltr].sort((a, b) => a - b));

    await page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'));
    const rtl = await buttonLefts(page);
    await page.locator('html').evaluate((el) => el.removeAttribute('dir'));

    // RTL: the same DOM order now runs right-to-left, from logical properties
    // alone - no mirrored stylesheet.
    expect(rtl).toEqual([...rtl].sort((a, b) => b - a));
  });
});
