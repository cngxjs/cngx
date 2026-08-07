import { expect, test, type Page } from '@playwright/test';

// Page-level @container contracts: breakpoints driven by the real viewport,
// which a component-isolated unit spec cannot exercise - jsdom's CSSOM parses
// neither @container nor @scope, so getComputedStyle reads '' in ng test no
// matter what the stylesheet says. Each test drives page.setViewportSize across
// the container breakpoint on a demo route and reads the descendant effect via
// getComputedStyle, mirroring the unit-geometry assertion shape one layer up.
//
// Timeline's own @container 32rem degrade and full-page RTL reversal are already
// asserted in e2e/timeline-layout.spec.ts ('alternate collapses to the start
// raster below the 32rem container' + 'dir="rtl" reverses the run...'), so this
// file covers the two axes that had no page-level guard: paginator and stepper.

const PAGINATOR_RESPONSIVE = '/#/ui/paginator/paginator-behaviors/responsive-collapse';
const STEPPER = '/#/ui/stepper/stepper-connectors/wizard-rail';

function display(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).display);
}

test.describe('css-contract: @container paginator responsive swap (24rem)', () => {
  test('above the breakpoint the number row shows and the status readout is hidden', async ({
    page,
  }) => {
    await page.goto(PAGINATOR_RESPONSIVE);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator('cngx-paginator')).toBeVisible();

    expect(await display(page, 'cngx-pgn-pages')).not.toBe('none');
    expect(await display(page, 'cngx-pgn-status')).toBe('none');
  });

  test('below the breakpoint the number row collapses and the status readout takes over', async ({
    page,
  }) => {
    await page.goto(PAGINATOR_RESPONSIVE);
    // The demo caps its wrapper at max-inline-size:100%, so a phone-width
    // viewport pulls the paginator container below the 24rem container query.
    await page.setViewportSize({ width: 360, height: 900 });
    await expect(page.locator('cngx-paginator')).toBeVisible();

    expect(await display(page, 'cngx-pgn-pages')).toBe('none');
    expect(await display(page, 'cngx-pgn-status')).not.toBe('none');
  });
});

test.describe('css-contract: @container stepper panel padding (600px)', () => {
  test('the panel padding tightens once the stepper container narrows past 600px', async ({
    page,
  }) => {
    await page.goto(STEPPER);

    // The visible panel's resolved padding-top. Returns NaN mid-reflow (the
    // panel briefly re-renders on a container-query relayout), so every read is
    // wrapped in expect.poll to wait past the transient.
    const readPaddingTop = () =>
      page
        .locator('.cngx-stepper__panel:not([hidden])')
        .first()
        .evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingTop));

    await page.setViewportSize({ width: 1280, height: 900 });
    let wide = Number.NaN;
    await expect
      .poll(async () => (wide = await readPaddingTop()))
      .toBeGreaterThan(0);

    // The container query fires: below 600px the panel takes the compact
    // padding, strictly smaller than the wide default. poll retries through the
    // stale wide value until the narrow padding settles below it.
    await page.setViewportSize({ width: 480, height: 900 });
    await expect.poll(async () => readPaddingTop()).toBeLessThan(wide);
  });
});
