import { expect, test, type Page } from '@playwright/test';

const R = {
  multiBasic: '/#/forms/select/multi-select/multi-basic',
  outlineAnatomy: '/#/forms/field/skin/outline-anatomy',
};

// The mount-time close emit ran its focus restore in a microtask after the
// first effect flush; two frames later any stray restore has landed.
async function settledActiveElement(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const active = document.activeElement;
            resolve(active === document.body ? 'body' : (active?.className ?? String(active)));
          }),
        ),
      ),
  );
}

test.describe('select family keeps page focus on mount', () => {
  test('multi-basic: no select trigger takes focus on load', async ({ page }) => {
    await page.goto(R.multiBasic);
    await page.locator('main .cngx-multi-select__trigger').first().waitFor();
    expect(await settledActiveElement(page)).toBe('body');
  });

  test('outline-anatomy: none of several selects takes focus on load', async ({ page }) => {
    await page.goto(R.outlineAnatomy);
    await page.locator('main cngx-form-field').first().waitFor();
    expect(await settledActiveElement(page)).toBe('body');
  });
});
