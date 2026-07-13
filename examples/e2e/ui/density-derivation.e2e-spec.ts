import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../_helpers';

// Behavioural proof that wave-1 components derive their spacing from
// `--cngx-space-*`, so a global `[data-density]` re-scales them. Each
// component is ViewEncapsulation.None, so once its route has loaded the
// (global) component CSS, a synthetic element carrying the component
// class picks up the same padding rules. We measure that synthetic
// element under a `[data-density]` ancestor. See
// examples/e2e/core/density.e2e-spec.ts for the foundation cascade.

/**
 * Resolve `paddingTop` of a freshly-inserted element with `className`,
 * optionally nested under an ancestor carrying `[data-density]` and/or a
 * host class (for tokens SET on a group ancestor and inherited down).
 */
async function paddingTopOf(
  page: Page,
  className: string,
  opts: { density?: string; hostClass?: string } = {},
) {
  return page.evaluate(({ className, density, hostClass }) => {
    const outer = document.createElement('div');
    if (density) {
      outer.setAttribute('data-density', density);
    }
    let mount: HTMLElement = outer;
    if (hostClass) {
      const host = document.createElement('div');
      host.className = hostClass;
      outer.appendChild(host);
      mount = host;
    }
    const el = document.createElement('div');
    el.className = className;
    mount.appendChild(el);
    document.body.appendChild(outer);
    const v = getComputedStyle(el).paddingTop;
    outer.remove();
    return v;
  }, { className, density: opts.density, hostClass: opts.hostClass });
}

/**
 * Resolve a custom property on a synthetic element with `className`
 * (plus an optional `[data-skin]`), nested under an optional
 * `[data-density]` ancestor.
 */
async function resolveVar(
  page: Page,
  className: string,
  prop: string,
  opts: { density?: string; dataSkin?: string } = {},
) {
  return page.evaluate(({ className, prop, density, dataSkin }) => {
    const outer = document.createElement('div');
    if (density) {
      outer.setAttribute('data-density', density);
    }
    const el = document.createElement('div');
    el.className = className;
    if (dataSkin) {
      el.setAttribute('data-skin', dataSkin);
    }
    outer.appendChild(el);
    document.body.appendChild(outer);
    const v = getComputedStyle(el).getPropertyValue(prop).trim();
    outer.remove();
    return v;
  }, { className, prop, density: opts.density, dataSkin: opts.dataSkin });
}

test.describe('ui/data-grid-accordion — row spacing derives from the density scale', () => {
  test.beforeEach(async ({ page }) => {
    // The ledger route loads the global data-grid CSS (ViewEncapsulation.None).
    await gotoDemo(page, 'ui/data-grid-accordion/ledger');
    await expect(page.locator('.cngx-data-grid-accordion').first()).toBeVisible();
  });

  const GRID = 'cngx-data-grid-accordion';

  test('unskinned default --cngx-dga-row-py tracks density (space-sm: 8 / 4)', async ({ page }) => {
    expect(await resolveVar(page, GRID, '--cngx-dga-row-py')).toBe('8px');
    expect(await resolveVar(page, GRID, '--cngx-dga-row-py', { density: 'compact' })).toBe('4px');
  });

  for (const skin of ['ledger', 'log-stream', 'master-detail', 'report'] as const) {
    test(`migrated skin '${skin}' row-py tracks density (8 -> 4)`, async ({ page }) => {
      expect(await resolveVar(page, GRID, '--cngx-dga-row-py', { dataSkin: skin })).toBe('8px');
      expect(
        await resolveVar(page, GRID, '--cngx-dga-row-py', { dataSkin: skin, density: 'compact' }),
      ).toBe('4px');
    });
  }

  test("'density' skin is exempt (deferred to Phase 6) — stays developer-driven", async ({ page }) => {
    // Its literal 0.6rem is unchanged by a root [data-density]; global density
    // deliberately does not reach it yet.
    const comfortable = await resolveVar(page, GRID, '--cngx-dga-row-py', { dataSkin: 'density' });
    const compact = await resolveVar(page, GRID, '--cngx-dga-row-py', {
      dataSkin: 'density',
      density: 'compact',
    });
    expect(comfortable).toBe(compact);
    expect(compact).not.toBe('4px');
  });
});

test.describe('common/card — padding derives from the density scale', () => {
  test.beforeEach(async ({ page }) => {
    // Any card route loads the global .cngx-card CSS (ViewEncapsulation.None).
    await gotoDemo(page, 'common/card/title-subtitle-footer');
    await expect(page.locator('.cngx-card').first()).toBeVisible();
  });

  test('.cngx-card padding tracks [data-density] (space-md: 16 / 8 / 20)', async ({ page }) => {
    // --cngx-card-padding is intentionally unregistered, so the
    // var(--cngx-card-padding, var(--cngx-space-md)) fallback fires and
    // follows the density swap. Before the un-register it was pinned to
    // the 16px @property initial-value in every density.
    expect(await paddingTopOf(page, 'cngx-card')).toBe('16px');
    expect(await paddingTopOf(page, 'cngx-card', { density: 'compact' })).toBe('8px');
    expect(await paddingTopOf(page, 'cngx-card', { density: 'spacious' })).toBe('20px');
  });
});
