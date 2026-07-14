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
  opts: { density?: string; dataSkin?: string; dataPaginatorSize?: string; tag?: string } = {},
) {
  return page.evaluate(({ className, prop, density, dataSkin, dataPaginatorSize, tag }) => {
    const outer = document.createElement('div');
    if (density) {
      outer.setAttribute('data-density', density);
    }
    // Some components (e.g. cngx-sidenav) style a custom-element tag, not a
    // class, so the probe element must be created with that tag name.
    const el = document.createElement(tag ?? 'div');
    if (className) {
      el.className = className;
    }
    if (dataSkin) {
      el.setAttribute('data-skin', dataSkin);
    }
    if (dataPaginatorSize) {
      el.setAttribute('data-paginator-size', dataPaginatorSize);
    }
    outer.appendChild(el);
    document.body.appendChild(outer);
    const v = getComputedStyle(el).getPropertyValue(prop).trim();
    outer.remove();
    return v;
  }, {
    className,
    prop,
    density: opts.density,
    dataSkin: opts.dataSkin,
    dataPaginatorSize: opts.dataPaginatorSize,
    tag: opts.tag,
  });
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

test.describe('ui/accordion — default padding derives from the density scale', () => {
  test.beforeEach(async ({ page }) => {
    // A panel-content route renders a default (unskinned) cngx-accordion-group,
    // loading the global accordion CSS (ViewEncapsulation.None).
    await gotoDemo(page, 'ui/accordion/panel-content/checklist');
    await expect(page.locator('.cngx-accordion-group').first()).toBeVisible();
  });

  test('unskinned default header-padding tracks density (8px 16px -> 4px 8px)', async ({ page }) => {
    const GROUP = 'cngx-accordion-group';
    expect(await resolveVar(page, GROUP, '--cngx-accordion-header-padding')).toBe('8px 16px');
    expect(
      await resolveVar(page, GROUP, '--cngx-accordion-header-padding', { density: 'compact' }),
    ).toBe('4px 8px');
  });
});

test.describe('ui/paginator - spacing derives from the scale; size preset is a private axis', () => {
  test.beforeEach(async ({ page }) => {
    // A paginator skin route loads the global .cngx-paginator CSS
    // (ViewEncapsulation.None): the base file + component skins.
    await gotoDemo(page, 'ui/paginator/paginator-skins/numbered');
    await expect(page.locator('.cngx-paginator').first()).toBeVisible();
  });

  const PGN = 'cngx-paginator';

  test('default paginator gap tokens track a root [data-density] (row-gap 8/4, gap 4/2)', async ({
    page,
  }) => {
    // The base rule SETs both from the scale, so a root [data-density] compacts
    // the DEFAULT paginator (density()='default' no longer stamps [data-density]).
    expect(await resolveVar(page, PGN, '--cngx-paginator-row-gap')).toBe('8px');
    expect(await resolveVar(page, PGN, '--cngx-paginator-row-gap', { density: 'compact' })).toBe(
      '4px',
    );
    expect(await resolveVar(page, PGN, '--cngx-paginator-gap')).toBe('4px');
    expect(await resolveVar(page, PGN, '--cngx-paginator-gap', { density: 'compact' })).toBe('2px');
  });

  test('[density] size preset shrinks button-size via [data-paginator-size], independent of the scale', async ({
    page,
  }) => {
    // The private size axis no longer squats on [data-density]: a global density
    // compacts spacing but leaves the hit-target alone; [data-paginator-size]
    // shrinks it. (Root font-size is pinned to 16px on the examples app.)
    expect(await resolveVar(page, PGN, '--cngx-paginator-button-size')).toBe('36px');
    expect(
      await resolveVar(page, PGN, '--cngx-paginator-button-size', { dataPaginatorSize: 'compact' }),
    ).toBe('28px');
    expect(await resolveVar(page, PGN, '--cngx-paginator-button-size', { density: 'compact' })).toBe(
      '36px',
    );
  });
});

test.describe('ui/feedback - alert / toast spacing derives from the density scale', () => {
  test('alert padding tracks a root [data-density] (8px 16px -> 4px 8px)', async ({ page }) => {
    // The severities route loads the global .cngx-alert CSS (ViewEncapsulation.None);
    // the :scope rule SETs --cngx-alert-padding from --cngx-space-sm/md.
    await gotoDemo(page, 'ui/feedback/alert/severities');
    await expect(page.locator('.cngx-alert').first()).toBeVisible();
    expect(await resolveVar(page, 'cngx-alert', '--cngx-alert-padding')).toBe('8px 16px');
    expect(await resolveVar(page, 'cngx-alert', '--cngx-alert-padding', { density: 'compact' })).toBe(
      '4px 8px',
    );
  });

  test('toast-outlet gap tracks a root [data-density] (space-sm: 8 -> 4)', async ({ page }) => {
    // The declarative toast route mounts a cngx-toast-outlet, loading its global
    // CSS; the outlet :scope SETs --cngx-toast-gap from --cngx-space-sm.
    await gotoDemo(page, 'ui/feedback/toast/declarative-cngx-toast');
    expect(await resolveVar(page, 'cngx-toast-outlet', '--cngx-toast-gap')).toBe('8px');
    expect(await resolveVar(page, 'cngx-toast-outlet', '--cngx-toast-gap', { density: 'compact' })).toBe(
      '4px',
    );
  });
});

test.describe('ui/tab-overflow - item padding derives from the density scale', () => {
  test('overflow item padding tracks a root [data-density] (space-sm: 8/8 -> 4/4)', async ({ page }) => {
    // A tab-overflow route loads the global .cngx-tab-overflow CSS (ViewEncapsulation.None);
    // the :scope SETs --cngx-tab-overflow-item-padding from --cngx-space-sm (both axes).
    await gotoDemo(page, 'ui/tabs/tab-overflow/8-tabs-in-a-narrow-container');
    // Wait for the overflow molecule to mount so its ViewEncapsulation.None
    // styles (and the @property registration) are injected before probing.
    await page.locator('.cngx-tab-overflow').first().waitFor({ state: 'attached' });
    expect(await resolveVar(page, 'cngx-tab-overflow', '--cngx-tab-overflow-item-padding')).toBe(
      '8px 8px',
    );
    expect(
      await resolveVar(page, 'cngx-tab-overflow', '--cngx-tab-overflow-item-padding', {
        density: 'compact',
      }),
    ).toBe('4px 4px');
  });
});

test.describe('ui/sidenav - nav-link padding derives from the density scale', () => {
  test('nav-link padding tracks a root [data-density] (shift 10->8: 8px 16px -> 4px 8px)', async ({
    page,
  }) => {
    // A sidenav route loads the global cngx-sidenav CSS (ViewEncapsulation.None);
    // the cngx-sidenav host SETs --cngx-nav-link-padding from --cngx-space-sm/md.
    // Probe a SHIFTED token (10->8) so a mis-ranked rung is caught.
    await gotoDemo(page, 'ui/sidenav/full-navigation-sidebar');
    await page.locator('cngx-sidenav').first().waitFor({ state: 'attached' });
    expect(await resolveVar(page, '', '--cngx-nav-link-padding', { tag: 'cngx-sidenav' })).toBe(
      '8px 16px',
    );
    expect(
      await resolveVar(page, '', '--cngx-nav-link-padding', {
        tag: 'cngx-sidenav',
        density: 'compact',
      }),
    ).toBe('4px 8px');
  });
});

test.describe('ui/action-button - padding derives from the density scale', () => {
  test('action-button padding tracks a root [data-density] (sm/md: 8px 16px -> 4px 8px)', async ({
    page,
  }) => {
    // An action-button route loads the global .cngx-action-button CSS
    // (ViewEncapsulation.None); the rule SETs --cngx-action-btn-padding from the scale.
    await gotoDemo(page, 'ui/action-button/async-button/random-outcome');
    await page.locator('.cngx-action-button').first().waitFor({ state: 'attached' });
    expect(await resolveVar(page, 'cngx-action-button', '--cngx-action-btn-padding')).toBe(
      '8px 16px',
    );
    expect(
      await resolveVar(page, 'cngx-action-button', '--cngx-action-btn-padding', {
        density: 'compact',
      }),
    ).toBe('4px 8px');
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
