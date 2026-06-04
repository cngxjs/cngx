import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxPopoverPanel renders a styled panel attached to a trigger.

test.describe('common/popover/popover-panel', () => {
  test('content-states: panel mounts under its trigger', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/content-states');
    const triggers = page.getByRole('button');
    expect(await triggers.count()).toBeGreaterThan(0);
  });

  test('variants: panel variants render', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/variants');
  });

  test('with-footer-actions: panel includes a footer actions row', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/with-footer-actions');
  });

  // Regression: the arrow ornament must track the trigger horizontally even
  // when the browser shifts the panel for viewport-fit recovery. The `info`
  // chip in the variants story sits close to the viewport's left edge so a
  // wide panel cannot anchor-centre without clipping — the browser shifts
  // the panel right and a plain `left: 50%` arrow used to follow the panel,
  // landing over an unrelated chip. CngxPopover writes the offset from the
  // live trigger / panel geometry to keep the arrow pinned to the trigger.
  test('variants: arrow tracks trigger after viewport-shift recovery', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/variants');
    const trigger = page.getByRole('button', { name: 'info' });
    await trigger.click();

    const panel = page.locator('cngx-popover-panel.cngx-popover-panel--info');
    await panel.waitFor({ state: 'visible' });

    const arrow = panel.locator('.cngx-popover-panel__arrow');
    await arrow.waitFor({ state: 'visible' });

    const triggerBox = await trigger.boundingBox();
    const arrowBox = await arrow.boundingBox();
    expect(triggerBox, 'trigger has bounding box').not.toBeNull();
    expect(arrowBox, 'arrow has bounding box').not.toBeNull();

    const triggerCenterX = triggerBox!.x + triggerBox!.width / 2;
    const arrowCenterX = arrowBox!.x + arrowBox!.width / 2;
    const delta = Math.abs(arrowCenterX - triggerCenterX);

    // 5px tolerance covers sub-pixel rounding plus the rounded-corner clamp
    // (the clamp kicks in when the trigger sits outside the panel's inline
    // extent; for the info chip the clamp does NOT engage so the arrow
    // should land within a pixel of the trigger centre).
    expect(delta, `arrow off trigger centre by ${delta.toFixed(1)}px`).toBeLessThan(5);
  });

  // Regression: compound placements (`bottom-start`, `top-end`, …) write
  // `position-area: bottom span-right` which browsers serialise back as
  // `span-right bottom`. Earlier the arrow CSS selected on substring
  // `style*='position-area: bottom'` which never matched the reordered
  // value, leaving the arrow at its static-flow position in the panel
  // corner. The placement is now keyed off `data-arrow-placement` so the
  // arrow sits at the expected edge regardless of keyword order.
  test('with-dividers: bottom-start arrow sits on the top edge of the panel', async ({ page }) => {
    await gotoDemo(page, 'common/popover/popover-panel/with-dividers');
    const trigger = page.getByRole('button', { name: 'BA 247 to NRT' });
    await trigger.click();

    const panel = page.locator('cngx-popover-panel');
    await panel.waitFor({ state: 'visible' });

    const arrow = panel.locator('.cngx-popover-panel__arrow');
    const panelBox = await panel.boundingBox();
    const arrowBox = await arrow.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(arrowBox).not.toBeNull();

    // Arrow should hug the panel's top edge for `bottom-*` placements,
    // not be tucked inside the padding (the visual bug we were fixing).
    const arrowCentreY = arrowBox!.y + arrowBox!.height / 2;
    const panelTop = panelBox!.y;
    expect(Math.abs(arrowCentreY - panelTop), 'arrow centre should sit on panel top edge').toBeLessThan(6);

    // Horizontal pin: trigger centre vs arrow centre within the clamp.
    const triggerBox = await trigger.boundingBox();
    const triggerCentreX = triggerBox!.x + triggerBox!.width / 2;
    const arrowCentreX = arrowBox!.x + arrowBox!.width / 2;
    expect(Math.abs(arrowCentreX - triggerCentreX), 'arrow should pin to trigger centre').toBeLessThan(5);
  });

  // Regression: when positionTryFallbacks lets the browser flip the panel
  // from `bottom` to `top`, the arrow's edge must follow. The library reads
  // the live trigger/panel rects on every show and routes the arrow to the
  // panel edge that faces the trigger — no consumer wiring required.
  test('edge-shift-arrow: arrow follows browser flip recovery', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await gotoDemo(page, 'common/popover/popover-panel/edge-shift-arrow');
    const trigger = page.getByRole('button', { name: 'flip if no room below' });

    // Park the trigger near the viewport bottom: enough room above for the
    // panel, almost none below. Forces position-try-fallbacks to flip.
    await trigger.evaluate((el) => el.scrollIntoView({ block: 'end' }));
    await trigger.click();

    const panel = page.locator('cngx-popover-panel.cngx-popover--open').first();
    await panel.waitFor({ state: 'visible' });

    const dataPlacement = await panel.evaluate((el) => el.getAttribute('data-arrow-placement'));
    const arrow = panel.locator('.cngx-popover-panel__arrow');
    const panelBox = await panel.boundingBox();
    const triggerBox = await trigger.boundingBox();
    const arrowBox = await arrow.boundingBox();

    // Browser should have flipped: requested bottom, but no room below,
    // so the panel sits ABOVE the trigger. The arrow must therefore sit
    // on the panel's BOTTOM edge (data-arrow-placement === 'top').
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(triggerBox!.y + 6);
    expect(dataPlacement, 'arrow edge should reflect actual rendered placement').toBe('top');

    const arrowCentreY = arrowBox!.y + arrowBox!.height / 2;
    const panelBottom = panelBox!.y + panelBox!.height;
    expect(Math.abs(arrowCentreY - panelBottom), 'arrow should sit on panel bottom edge after flip').toBeLessThan(6);
  });
});
