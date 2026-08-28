import { expect, test } from '@playwright/test';

// System-token cascade contract: every registration in
// core/theming/system-tokens.css carries `@property ... inherits: true`,
// so a :root override in @layer cngx.theme must reach descendants. A
// registered `inherits: false` fails this silently (every element computes
// the initial-value), and jsdom cannot catch it - its CSSOM ignores
// @property, so getComputedStyle in ng test lies about the cascade. Pinned
// here at page level instead, on one representative of the flipped
// families (radius).

const HOME = '/#/';
const THEME_OVERRIDE = '@layer cngx.theme { :root { --cngx-radius-md: 3px; } }';

test.describe('css-contract: system tokens inherit from :root', () => {
  test('a :root radius override reaches a nested element', async ({ page }) => {
    await page.goto(HOME);
    await page.addStyleTag({ content: THEME_OVERRIDE });

    // The home filter input sits many layers below :root; with
    // inherits: true the computed custom property carries the override,
    // with inherits: false it would read the registered 8px initial.
    const nested = page.locator('input').first();
    await expect(nested).toBeVisible();
    const value = await nested.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--cngx-radius-md').trim(),
    );
    expect(value).toBe('3px');
  });

  test('the override lands on the rendered border-radius of a consuming element', async ({
    page,
  }) => {
    await page.goto(HOME);
    await page.addStyleTag({ content: THEME_OVERRIDE });

    // cngx.base styles bare inputs with
    // `border-radius: var(--cngx-radius-md, 8px)` - the themed token must
    // land on the painted property, not just on the custom-property slot.
    // The home filter input carries app chrome that pins its own radius,
    // so the assertion runs on a chrome-free bare input appended to the
    // page body (styled by the same cngx.base rule).
    const radius = await page.evaluate(() => {
      const input = document.createElement('input');
      document.body.append(input);
      const value = getComputedStyle(input).borderRadius;
      input.remove();
      return value;
    });
    expect(radius).toBe('3px');
  });
});
