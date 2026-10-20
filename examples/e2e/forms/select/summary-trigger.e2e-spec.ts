import { devices, type Locator, type Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: forms/select/mobile-sheet/all-variants. Under the touch floor (any
// coarse pointer) the multi-value triggers show a one-line summary instead of
// chips and keep the 44px row at every selection count. Phones open the sheet,
// the iPad Pro 11 (834px, above the 48rem sheet breakpoint) keeps the anchored
// panel; a desktop pointer keeps the chips.

const ALL = 'forms/select/mobile-sheet/all-variants';

interface Variant {
  readonly host: string;
  readonly role: 'option' | 'treeitem';
  readonly checkedAttr: 'aria-selected' | 'aria-checked';
  /** Tree row to expand before picking. */
  readonly expand?: string;
  readonly picks: readonly string[];
}

const VARIANTS: readonly Variant[] = [
  {
    host: 'cngx-multi-select',
    role: 'option',
    checkedAttr: 'aria-selected',
    picks: ['Athens', 'Berlin', 'Rome'],
  },
  {
    host: 'cngx-tree-select',
    role: 'treeitem',
    checkedAttr: 'aria-checked',
    expand: 'North',
    picks: ['Oslo', 'Stockholm', 'Helsinki'],
  },
];

const panelOf = (host: Locator) => host.locator('.cngx-select__panel');
const triggerOf = (host: Locator) => host.locator('[role="combobox"]').first();

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Trigger box in document coordinates, so a page scroll does not move it. */
function boxOf(trigger: Locator): Promise<Box> {
  return trigger.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  });
}

/**
 * A panel row by its visible label. A parent treeitem's accessible name also
 * carries its twisty's "Expand node" label, so the tree rows match on the
 * label span instead of the role name.
 */
function rowOf(panel: Locator, variant: Variant, name: string): Locator {
  if (variant.role === 'option') {
    return panel.getByRole('option', { name, exact: true });
  }
  return panel
    .getByRole('treeitem')
    .filter({
      has: panel.page().locator('.cngx-tree-select__label', { hasText: new RegExp(`^${name}$`) }),
    });
}

async function pickThree(page: Page, host: Locator, variant: Variant, tap: boolean): Promise<void> {
  const press = (target: Locator) => (tap ? target.tap() : target.click());
  const trigger = triggerOf(host);
  await trigger.scrollIntoViewIfNeeded();
  await press(trigger);
  const panel = panelOf(host);
  await expect(panel).toBeVisible();
  if (variant.expand) {
    const row = rowOf(panel, variant, variant.expand);
    await press(row.locator('.cngx-tree-select__twisty'));
    await expect(row).toHaveAttribute('aria-expanded', 'true');
  }
  for (const name of variant.picks) {
    const option = rowOf(panel, variant, name);
    await press(option);
    await expect(option).toHaveAttribute(variant.checkedAttr, 'true');
  }
  const modal = (await panel.getAttribute('aria-modal')) === 'true';
  if (modal) {
    await panel.locator('.cngx-select-sheet-header__done').tap();
  } else {
    await page.keyboard.press('Escape');
  }
  await expect(panel).toBeHidden();
}

for (const device of ['iPhone 13', 'Pixel 7', 'iPad Pro 11'] as const) {
  test.describe(`select summary trigger on ${device}`, () => {
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices[device];
    test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

    test.beforeEach(({ browserName }) => {
      test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
    });

    for (const variant of VARIANTS) {
      const selector = variant.host;
      test(`${selector} summarizes three values in one 44px row that does not move`, async ({
        page,
      }) => {
        await gotoDemo(page, ALL);
        const host = page.locator(selector).first();
        const trigger = triggerOf(host);
        const empty = await boxOf(trigger);
        expect(empty.height).toBe(44);

        await pickThree(page, host, variant, true);

        await expect(trigger.locator('cngx-chip')).toHaveCount(0);
        await expect(trigger.locator('.cngx-select-summary__label')).toHaveText(variant.picks[0]);
        await expect(trigger.locator('.cngx-select__chip-overflow-badge')).toHaveText('+2');
        await expect(trigger.locator('cngx-select-summary .cngx-sr-only')).toContainText(
          '3 selected',
        );
        expect(await boxOf(trigger)).toEqual(empty);
      });
    }
  });
}

// The project runs Desktop Chrome, a fine pointer: no touch floor.
test.describe('select summary trigger on a desktop pointer', () => {
  for (const variant of VARIANTS) {
    test(`${variant.host} keeps the chips`, async ({ page }) => {
      await gotoDemo(page, ALL);
      const host = page.locator(variant.host).first();
      await pickThree(page, host, variant, false);
      const trigger = triggerOf(host);
      await expect(trigger.locator('cngx-chip')).toHaveCount(3);
      await expect(trigger.locator('cngx-select-summary')).toHaveCount(0);
    });
  }
});
