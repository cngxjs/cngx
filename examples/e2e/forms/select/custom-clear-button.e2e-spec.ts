import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: the custom *cngxSelectClearButton slot. The slot content owns its
// tap target, so the story's compact button has to meet the touch floor the
// default clear button meets: at least 44x44 under a coarse pointer (only an
// isMobile + hasTouch context reports one), without growing the trigger row.
const ROUTE = 'forms/select/combobox/combobox-clearable-custom-cngxselectclearbutton';
const FLOOR = 44;

const triggerOf = (page: Page) => page.locator('cngx-combobox .cngx-combobox__trigger').first();
const resetOf = (page: Page) =>
  page.locator('cngx-combobox').getByRole('button', { name: 'Reset all' });

async function heightOf(el: Locator): Promise<number> {
  const box = await el.boundingBox();
  expect(box, 'element has no box').not.toBeNull();
  return box!.height;
}

// Trigger height with the slot button taken out of layout and put back. The
// chips stay, so the delta is the button's own contribution to the row (a
// chip under the touch floor has its own height, owned elsewhere).
async function rowDeltaOf(page: Page, button: Locator): Promise<number> {
  const withSlot = await heightOf(triggerOf(page));
  const handle = await button.elementHandle();
  await handle!.evaluate((el) => ((el as HTMLElement).style.display = 'none'));
  const withoutSlot = await heightOf(triggerOf(page));
  await handle!.evaluate((el) => ((el as HTMLElement).style.display = ''));
  return Math.abs(withSlot - withoutSlot);
}

test.describe('custom clear button on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(({ browserName }) => {
    test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
  });

  test('the slot button is a touch-floor hit area and the row keeps its height', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    const reset = resetOf(page);
    await expect(reset).toBeVisible();
    const box = await reset.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(FLOOR - 0.5);
    expect(box!.height).toBeGreaterThanOrEqual(FLOOR - 0.5);
    expect(await rowDeltaOf(page, reset)).toBeLessThanOrEqual(0.5);
  });
});

test.describe('custom clear button on a desktop', () => {
  test('the slot button stays compact on a fine pointer and the row keeps its height', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);
    const reset = resetOf(page);
    await expect(reset).toBeVisible();
    expect(await heightOf(reset)).toBeLessThan(FLOOR - 0.5);
    expect(await rowDeltaOf(page, reset)).toBeLessThanOrEqual(0.5);
  });
});
