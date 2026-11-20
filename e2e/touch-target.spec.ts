import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * Behavioural proof for the `--cngx-target-min` hit-area floor. jsdom
 * models neither `@property` inheritance nor the `(any-pointer: coarse)`
 * media feature, so the floor is proven here in real Chromium.
 *
 * Pointer modality is driven by the browser CONTEXT, not by
 * `Emulation.setEmulatedMedia`: CDP does not expose `any-pointer` as an
 * emulatable media feature (it stays `fine` after the call), but a
 * context opened with `isMobile + hasTouch` reports `(any-pointer:
 * coarse)` deterministically. The default desktop context is the fine
 * half. Both measure at `compact` density, so the coarse assertion also
 * proves the floor composes with density instead of replacing it.
 */

const FLOOR = 44;

// Every clamped surface. `axis` is the constrained dimension the floor
// lifts: 'block' for row controls, 'inline' where noted. The first group is
// the foundation set; the second is the completion sweep; the third is the
// third-tier sweep (always-rendered surfaces only). The treetable
// expander is clamped and guarded by the source-CSS coverage spec, but
// @cngx/data-display ships no demo route, so it has no behavioural entry here.
// `coarse` overrides the mobile viewport for a surface whose responsive
// design collapses at phone width (the stepper swaps its step rail for a
// mobile summary below a tablet breakpoint, so it is measured on a touch
// tablet that still reports `(any-pointer: coarse)`). `opener` is clicked
// before the measurement for a surface that renders inside a closed panel.
const ATOMS: {
  name: string;
  route: string;
  selector: string;
  axis: 'block' | 'inline';
  coarse?: { width: number; height: number };
  opener?: string;
}[] = [
  {
    name: 'checkbox',
    route: '/#/common/interactive/checkbox/base/basic-two-way-binding',
    selector: '.cngx-checkbox',
    axis: 'block',
  },
  {
    name: 'radio',
    route: '/#/common/interactive/radio/basic-vertical-group',
    selector: '.cngx-radio',
    axis: 'block',
  },
  {
    name: 'toggle',
    route: '/#/common/interactive/toggle/basic-two-way-binding',
    selector: '.cngx-toggle',
    axis: 'block',
  },
  {
    name: 'chip',
    route: '/#/common/display/chip/removable',
    selector: '.cngx-chip',
    axis: 'block',
  },
  {
    name: 'chip-remove',
    route: '/#/common/display/chip/removable',
    selector: '.cngx-chip__remove',
    axis: 'inline',
  },
  {
    name: 'close-button',
    route: '/#/common/button/close-button/basic',
    selector: '.cngx-close-button',
    axis: 'block',
  },
  // The close button is a square target: the floor lifts both axes.
  {
    name: 'close-button-inline',
    route: '/#/common/button/close-button/basic',
    selector: '.cngx-close-button',
    axis: 'inline',
  },
  {
    name: 'button-toggle',
    route: '/#/common/interactive/button-toggle/group/basic-view-switcher',
    selector: '.cngx-button-toggle',
    axis: 'block',
  },
  {
    name: 'menu-item',
    route: '/#/common/interactive/menu/base/action-menu-with-separator',
    selector: '[cngxMenuItem]',
    axis: 'block',
  },
  // Completion sweep.
  {
    name: 'select-trigger',
    route: '/#/forms/select/single-select/clearable',
    selector: '.cngx-select__trigger',
    axis: 'block',
  },
  {
    name: 'listbox-option',
    route: '/#/common/interactive/listbox/base/single-select',
    selector: '[cngxOption]',
    axis: 'block',
  },
  {
    name: 'tab-header',
    route: '/#/ui/tabs/tab-layout/fitted-and-tab-alignment',
    selector: '.cngx-tabs__tab',
    axis: 'block',
  },
  {
    name: 'breadcrumb-item',
    route: '/#/common/interactive/breadcrumb/basic-trail',
    selector: '[cngxBreadcrumbItem]',
    axis: 'block',
  },
  {
    name: 'paginator-button',
    route: '/#/ui/paginator/paginator-skins/numbered',
    selector: '.cngx-paginator__button',
    axis: 'block',
    // Tablet coarse viewport: below 24rem the first/last chevrons collapse out
    // (container query), so a phone-width run would measure a hidden button.
    coarse: { width: 834, height: 1112 },
  },
  // The dot is a small SQUARE target lifted by padding on both axes, so it is
  // asserted on both (every other entry is a row control whose inline size is
  // uncontested).
  {
    name: 'paginator-dot',
    route: '/#/ui/paginator/paginator-skins/dots',
    selector: '.cngx-paginator__dot',
    axis: 'block',
  },
  {
    name: 'paginator-dot-inline',
    route: '/#/ui/paginator/paginator-skins/dots',
    selector: '.cngx-paginator__dot',
    axis: 'inline',
  },
  {
    name: 'stepper-step',
    route: '/#/ui/stepper/stepper-footer/complete-finish-button',
    selector: '.cngx-stepper__step',
    axis: 'block',
    coarse: { width: 834, height: 1112 },
  },
  {
    name: 'breadcrumb-overflow',
    route: '/#/ui/breadcrumb/overflow/collapsed-menu',
    selector: '.cngx-breadcrumb__overflow-trigger',
    axis: 'block',
  },
  // Third-tier sweep. Only always-rendered surfaces appear here. Interaction-
  // gated hosts (tab-overflow popover, breadcrumb-siblings dropdown, tree-select
  // panel node + twisty, popover action) are guarded by the source-CSS coverage
  // spec only: revealing them needs a click the navigate-only harness does not
  // perform, mirroring the treetable exclusion above.
  {
    name: 'rating-item',
    route: '/#/forms/input/rating/basic',
    selector: '.cngx-rating__item',
    axis: 'block',
  },
  {
    name: 'speak-button',
    route: '/#/ui/speak/speak-button/styled-speaker-icon',
    selector: '.cngx-speak-button__btn',
    axis: 'block',
  },
  {
    name: 'action-button',
    route: '/#/ui/action-button/async-button/string-labels',
    selector: '.cngx-action-button',
    axis: 'block',
  },
  {
    name: 'alert-dismiss',
    route: '/#/ui/feedback/alert/dismissible',
    selector: '.cngx-alert__dismiss',
    axis: 'inline',
  },
  {
    name: 'tab-nav-link',
    route: '/#/ui/tabs/tab-nav/leaf-links',
    selector: '.cngx-tab-nav__link',
    axis: 'block',
  },
  {
    name: 'button',
    route: '/#/common/button/button/variants',
    selector: ".cngx-button:not([data-variant='link'])",
    axis: 'block',
  },
  {
    name: 'icon-button',
    route: '/#/common/button/icon-button/basic',
    selector: '.cngx-icon-button',
    axis: 'block',
  },
  {
    name: 'icon-button-inline',
    route: '/#/common/button/icon-button/basic',
    selector: '.cngx-icon-button',
    axis: 'inline',
  },
  {
    name: 'menu-button',
    route: '/#/common/menu-button/menu-button/basic',
    selector: '.cngx-menu-button',
    axis: 'block',
  },
  {
    name: 'icon-menu-button',
    route: '/#/common/menu-button/icon-menu-button/kebab',
    selector: '.cngx-icon-menu-button',
    axis: 'inline',
  },
  {
    name: 'split-caret',
    route: '/#/common/menu-button/split-button/basic',
    selector: '.cngx-split-button > .cngx-icon-menu-button',
    axis: 'inline',
  },
  {
    name: 'split-caret-block',
    route: '/#/common/menu-button/split-button/basic',
    selector: '.cngx-split-button > .cngx-icon-menu-button',
    axis: 'block',
  },
  {
    name: 'action-button-outline',
    route: '/#/ui/action-button/async-button/string-labels',
    selector: ".cngx-action-button[data-variant='outline']",
    axis: 'block',
  },
  {
    name: 'popover-action',
    route: '/#/common/popover/popover-panel/with-footer-actions',
    selector: '.cngx-popover-action',
    axis: 'block',
    opener: '.demo-popover-stage button.chip',
  },
];

const applyCompact = () => document.documentElement.setAttribute('data-density', 'compact');

async function open(
  browser: Browser,
  route: string,
  pointer: 'coarse' | 'fine',
  coarseViewport: { width: number; height: number } = { width: 390, height: 844 },
  opener?: string,
): Promise<{ close: () => Promise<void>; page: Page }> {
  const context = await browser.newContext(
    pointer === 'coarse'
      ? { viewport: coarseViewport, isMobile: true, hasTouch: true }
      : { viewport: { width: 1280, height: 800 } },
  );
  const page = await context.newPage();
  await page.goto(route);
  await page.evaluate(applyCompact);
  if (opener) {
    await page.locator(opener).first().click();
  }
  return { page, close: () => context.close() };
}

async function constrainedSize(page: Page, selector: string, axis: 'block' | 'inline') {
  const target = page.locator(selector).first();
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  expect(box, `no bounding box for ${selector}`).not.toBeNull();
  return axis === 'block' ? box!.height : box!.width;
}

for (const atom of ATOMS) {
  test(`touch-target: ${atom.name} clamps to the ${FLOOR}px floor under a coarse pointer`, async ({
    browser,
    browserName,
  }) => {
    // Playwright cannot open an `isMobile` (coarse-pointer) context in Firefox,
    // so the coarse half runs on Chromium + WebKit; the fine half covers Firefox.
    test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
    const { page, close } = await open(browser, atom.route, 'coarse', atom.coarse, atom.opener);
    try {
      const size = await constrainedSize(page, atom.selector, atom.axis);
      expect(size).toBeGreaterThanOrEqual(FLOOR);
    } finally {
      await close();
    }
  });

  test(`touch-target: ${atom.name} stays below the floor under a fine pointer (composes with density)`, async ({
    browser,
  }) => {
    const { page, close } = await open(browser, atom.route, 'fine', undefined, atom.opener);
    try {
      const size = await constrainedSize(page, atom.selector, atom.axis);
      expect(size).toBeLessThan(FLOOR);
    } finally {
      await close();
    }
  });
}

// WCAG 2.5.8 (AA) on a mouse. `--cngx-target-min` stays 0px on a fine
// pointer (its readers treat a non-zero value as touch), so these hosts reach
// 24px through their own token: a hit area for a lone target, a 24px centre
// pitch for a dot row. Measured with `elementFromPoint`, so a clipped or
// covered hit zone fails even when the computed size looks right.
const FINE_FLOOR = 24;

async function openFine(
  browser: Browser,
  route: string,
  viewport: { width: number; height: number } = { width: 1280, height: 800 },
): Promise<{ close: () => Promise<void>; page: Page }> {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(route);
  return { page, close: () => context.close() };
}

// Probes 1px past each side of a 22px-reach box around the target centre.
async function hitsAround(page: Page, selector: string, reach: number): Promise<boolean[]> {
  await expect(page.locator(selector).first()).toBeVisible();
  return page.evaluate(
    ({ selector, reach }) => {
      const target = document.querySelector(selector)!;
      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return [
        [cx - reach, cy],
        [cx + reach, cy],
        [cx, cy - reach],
        [cx, cy + reach],
      ].map(([x, y]) => document.elementFromPoint(x, y)?.closest(selector) === target);
    },
    { selector, reach },
  );
}

async function dotPitch(page: Page, selector: string): Promise<number> {
  await expect(page.locator(selector).first()).toBeVisible();
  return page.evaluate((selector) => {
    const [a, b] = Array.from(document.querySelectorAll(selector)).map((el) => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    // Both centres must hit their own dot, or the pitch measures a covered row.
    const own = [a, b].every(
      (p, i) =>
        document.elementFromPoint(p.x, p.y)?.closest(selector) ===
        document.querySelectorAll(selector)[i],
    );
    return own ? b.x - a.x : 0;
  }, selector);
}

test('fine-floor: tab close button hits 24px around its 20px box', async ({ browser }) => {
  const { page, close } = await openFine(
    browser,
    '/#/ui/tabs/tab-dismissable/dismissable-and-addable',
  );
  try {
    expect(await hitsAround(page, '.cngx-tabs__close', FINE_FLOOR / 2 - 1)).toEqual([
      true,
      true,
      true,
      true,
    ]);
  } finally {
    await close();
  }
});

test('fine-floor: paginator dots sit 24px apart', async ({ browser }) => {
  const { page, close } = await openFine(browser, '/#/ui/paginator/paginator-parts/dots/dots');
  try {
    expect(await dotPitch(page, '.cngx-paginator__dot')).toBeGreaterThanOrEqual(FINE_FLOOR);
  } finally {
    await close();
  }
});

test('fine-floor: stepper mobile dots sit 24px apart', async ({ browser }) => {
  // Narrow enough that the stepper collapses below its 30rem container rung.
  const { page, close } = await openFine(
    browser,
    '/#/ui/stepper/stepper-mobile-collapse/dots-collapse',
    {
      width: 400,
      height: 800,
    },
  );
  try {
    expect(await dotPitch(page, '.cngx-stepper__mobile-dot')).toBeGreaterThanOrEqual(FINE_FLOOR);
  } finally {
    await close();
  }
});

test('fine-floor: sidenav resize handle hits 24px across the rail edge', async ({ browser }) => {
  const { page, close } = await openFine(browser, '/#/ui/sidenav/full-navigation-sidebar');
  try {
    const hits = await hitsAround(page, '.cngx-sidenav__resize-handle', FINE_FLOOR / 2 - 1);
    // Inline axis only: the handle spans the rail height.
    expect(hits.slice(0, 2)).toEqual([true, true]);
  } finally {
    await close();
  }
});
