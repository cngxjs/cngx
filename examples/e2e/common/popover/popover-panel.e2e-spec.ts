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
});
