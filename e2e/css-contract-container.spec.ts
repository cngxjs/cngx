import { expect, test, type Page } from '@playwright/test';

// Page-level @container contracts: breakpoints driven by the real viewport,
// which a component-isolated unit spec cannot exercise - jsdom's CSSOM parses
// neither @container nor @scope, so getComputedStyle reads '' in ng test no
// matter what the stylesheet says. Each test drives page.setViewportSize across
// the container breakpoint on a demo route and reads the descendant effect via
// getComputedStyle, mirroring the unit-geometry assertion shape one layer up.
//
// Timeline's own @container 30rem degrade and full-page RTL reversal are already
// asserted in e2e/timeline-layout.spec.ts ('alternate collapses to the start
// raster below the 30rem container' + 'dir="rtl" reverses the run...'), so this
// file covers the two axes that had no page-level guard: paginator and stepper.
//
// Both thresholds are rem tiers from core-concepts/responsive-by-default.md, and
// both are read off the component's OWN container, so these tests only work as
// long as the demo wrapper sits on both sides of the rung as the viewport moves.

const PAGINATOR_RESPONSIVE = '/#/ui/paginator/paginator-behaviors/responsive-collapse';
const STEPPER = '/#/ui/stepper/stepper-connectors/wizard-rail';

function display(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).display);
}

test.describe('css-contract: @container paginator responsive swap (30rem)', () => {
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
    // viewport pulls the paginator container below the 30rem container query.
    await page.setViewportSize({ width: 360, height: 900 });
    await expect(page.locator('cngx-paginator')).toBeVisible();

    expect(await display(page, 'cngx-pgn-pages')).toBe('none');
    expect(await display(page, 'cngx-pgn-status')).not.toBe('none');
  });
});

test.describe('css-contract: @container stepper collapse (30rem)', () => {
  test('the classic strip gives way to the compact count once the container narrows past 30rem', async ({
    page,
  }) => {
    await page.goto(STEPPER);

    // The stepper reads --cngx-stepper-collapse off its own ::after, written by
    // a @container rule. The demo wrapper is ~640px at desktop width and ~448px
    // at phone width, so the viewport straddles the 30rem (480px) rung.
    //
    // The sibling 48rem panel-padding rung is NOT asserted here: this demo's
    // container never exceeds 768px, so a viewport change cannot cross it.
    // It is covered where the host width can be forced - projects/ui/stepper/
    // stepper.geometry.spec.ts and examples/e2e/ui/stepper/
    // stepper-container-responsive.e2e-spec.ts.
    const strip = page.locator('.cngx-stepper__strip');
    const compact = page.locator('.cngx-stepper__mobile-text');

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(strip).toBeVisible();
    await expect(compact).toHaveCount(0);

    await page.setViewportSize({ width: 480, height: 900 });
    await expect(compact).toBeVisible();
    await expect(strip).toHaveCount(0);
  });
});
