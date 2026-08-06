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
// tablet that still reports `(any-pointer: coarse)`).
const ATOMS: {
  name: string;
  route: string;
  selector: string;
  axis: 'block' | 'inline';
  coarse?: { width: number; height: number };
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
    route: '/#/common/interactive/close-button/basic',
    selector: '.cngx-close-button__btn',
    axis: 'block',
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
    route: '/#/ui/feedback/alert/closable',
    selector: '.cngx-alert__dismiss',
    axis: 'inline',
  },
  {
    name: 'tab-nav-link',
    route: '/#/ui/tabs/tab-nav/leaf-links',
    selector: '.cngx-tab-nav__link',
    axis: 'block',
  },
];

const applyCompact = () => document.documentElement.setAttribute('data-density', 'compact');

async function open(
  browser: Browser,
  route: string,
  pointer: 'coarse' | 'fine',
  coarseViewport: { width: number; height: number } = { width: 390, height: 844 },
): Promise<{ close: () => Promise<void>; page: Page }> {
  const context = await browser.newContext(
    pointer === 'coarse'
      ? { viewport: coarseViewport, isMobile: true, hasTouch: true }
      : { viewport: { width: 1280, height: 800 } },
  );
  const page = await context.newPage();
  await page.goto(route);
  await page.evaluate(applyCompact);
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
    const { page, close } = await open(browser, atom.route, 'coarse', atom.coarse);
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
    const { page, close } = await open(browser, atom.route, 'fine');
    try {
      const size = await constrainedSize(page, atom.selector, atom.axis);
      expect(size).toBeLessThan(FLOOR);
    } finally {
      await close();
    }
  });
}
