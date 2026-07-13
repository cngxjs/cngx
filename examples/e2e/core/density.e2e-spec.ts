import { expect, test } from '@playwright/test';

// Behavioural proof for the density foundation. The examples app imports
// projects/themes/cngx.css from source, so the `--cngx-space-*`
// `@property` registrations are live in a real browser here — unlike
// jsdom, which models neither `@property { inherits }` nor
// custom-property inheritance. See density-tokens.spec.ts for the
// source-CSS contract guard.

/**
 * Resolve `--cngx-space-md` on a freshly-inserted descendant whose
 * ancestor pins the token inline. With `inherits: true` the descendant
 * reads the ancestor's value; with `inherits: false` it stays at the
 * registered `initial-value`.
 */
async function descendantSpaceMd(page: import('@playwright/test').Page, ancestorValue?: string) {
  return page.evaluate((value) => {
    const anc = document.createElement('div');
    if (value) {
      anc.style.setProperty('--cngx-space-md', value);
    }
    const desc = document.createElement('div');
    anc.appendChild(desc);
    document.body.appendChild(anc);
    const resolved = getComputedStyle(desc).getPropertyValue('--cngx-space-md').trim();
    anc.remove();
    return resolved;
  }, ancestorValue);
}

test.describe('core/theming — spacing scale inheritance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();
  });

  test('registered --cngx-space-md defaults to the comfortable 16px', async ({ page }) => {
    expect(await descendantSpaceMd(page)).toBe('16px');
  });

  test('an ancestor value cascades to a descendant (inherits: true)', async ({ page }) => {
    // The load-bearing assertion: fails while the registration is
    // inherits: false (descendant would resolve to the 16px
    // initial-value), passes once the flip lands.
    expect(await descendantSpaceMd(page, '8px')).toBe('8px');
  });
});
