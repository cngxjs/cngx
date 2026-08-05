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

// The atoms clamped in Phase 2. `axis` is the constrained dimension the
// floor lifts: 'block' for row controls, 'inline' where noted.
const ATOMS: { name: string; route: string; selector: string; axis: 'block' | 'inline' }[] = [
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
];

const applyCompact = () => document.documentElement.setAttribute('data-density', 'compact');

async function open(
  browser: Browser,
  route: string,
  pointer: 'coarse' | 'fine',
): Promise<{ close: () => Promise<void>; page: Page }> {
  const context = await browser.newContext(
    pointer === 'coarse'
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
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
  }) => {
    const { page, close } = await open(browser, atom.route, 'coarse');
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
