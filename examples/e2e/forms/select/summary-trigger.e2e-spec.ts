import { devices, type Locator, type Page } from '@playwright/test';
import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: forms/select/mobile-sheet/all-variants. Under the touch floor (any
// coarse pointer) the multi-value triggers show a one-line summary instead of
// chips and keep the 44px row at every selection count. Phones open the sheet,
// the iPad Pro 11 (834px, above the 48rem sheet breakpoint) keeps the anchored
// panel; a desktop pointer keeps the chips. The input variants (combobox,
// action multi-select) put the summary in front of their search input and
// describe the input with the whole selection.

const ALL = 'forms/select/mobile-sheet/all-variants';

interface Variant {
  readonly host: string;
  readonly role: 'option' | 'treeitem';
  readonly checkedAttr: 'aria-selected' | 'aria-checked';
  /** Tree row to expand before picking. */
  readonly expand?: string;
  readonly picks: readonly string[];
  /** The trigger keeps a search input; the selection rides on its describedby. */
  readonly input?: boolean;
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
  {
    host: 'cngx-combobox',
    role: 'option',
    checkedAttr: 'aria-selected',
    picks: ['Athens', 'Berlin', 'Rome'],
    input: true,
  },
  {
    host: 'cngx-action-multi-select',
    role: 'option',
    checkedAttr: 'aria-selected',
    picks: ['Athens', 'Berlin', 'Rome'],
    input: true,
  },
];

const INPUT_VARIANTS = VARIANTS.filter((variant) => variant.input);

const panelOf = (host: Locator) => host.locator('.cngx-select__panel');
const triggerOf = (host: Locator) => host.locator('[role="combobox"]').first();
/** The visible trigger row: the combobox itself, or the group around the input. */
const rowBoxOf = (host: Locator) => host.locator('.cngx-field-trigger').first();

/** Text of every node the element's aria-describedby references. */
function describedText(el: Locator): Promise<string> {
  return el.evaluate((node) =>
    (node.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' '),
  );
}

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
 * A panel row by its visible label. Tree rows match on the label span rather
 * than the treeitem role name.
 */
function rowOf(panel: Locator, variant: Variant, name: string): Locator {
  if (variant.role === 'option') {
    return panel.getByRole('option', { name, exact: true });
  }
  return panel.getByRole('treeitem').filter({
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
        const row = rowBoxOf(host);
        const empty = await boxOf(row);
        expect(empty.height).toBe(44);

        await pickThree(page, host, variant, true);

        await expect(row.locator('cngx-chip')).toHaveCount(0);
        await expect(row.locator('.cngx-select-summary__label')).toHaveText(variant.picks[0]);
        await expect(row.locator('.cngx-select__chip-overflow-badge')).toHaveText('+2');
        if (variant.input) {
          await expect.poll(() => describedText(triggerOf(host))).toContain('3 selected');
        } else {
          await expect(row.locator('cngx-select-summary .cngx-sr-only')).toContainText(
            '3 selected',
          );
        }
        expect(await boxOf(row)).toEqual(empty);
      });
    }
  });
}

for (const device of ['iPhone 13', 'Pixel 7'] as const) {
  test.describe(`select summary input variants typing on ${device}`, () => {
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices[device];
    test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

    test.beforeEach(({ browserName }) => {
      test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
    });

    for (const variant of INPUT_VARIANTS) {
      test(`${variant.host} filters through the sheet header search while the page is inert`, async ({
        page,
      }) => {
        await gotoDemo(page, ALL);
        const host = page.locator(variant.host).first();
        const trigger = triggerOf(host);
        await trigger.scrollIntoViewIfNeeded();
        await trigger.tap();
        const panel = panelOf(host);
        await expect(panel).toHaveAttribute('aria-modal', 'true');
        const radiogroup = page.getByRole('radiogroup', { name: 'Presentation' });
        expect(await radiogroup.evaluate((el) => el.closest('[inert]') !== null)).toBe(true);

        const search = panel.locator('.cngx-select-sheet-header__input');
        await search.tap();
        await page.keyboard.type('Ro');
        await expect(search).toBeFocused();
        await expect(panel.getByRole('option', { name: 'Rome', exact: true })).toBeVisible();
        await expect(panel.getByRole('option', { name: 'Athens', exact: true })).toHaveCount(0);
      });
    }
  });
}

test.describe('select summary input variants typing on iPad Pro 11', () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices['iPad Pro 11'];
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch });

  test.beforeEach(({ browserName }) => {
    test.skip(browserName === 'firefox', 'isMobile context is unsupported in Firefox');
  });

  for (const variant of INPUT_VARIANTS) {
    test(`${variant.host} filters the anchored list from the trigger input`, async ({ page }) => {
      await gotoDemo(page, ALL);
      const host = page.locator(variant.host).first();
      const trigger = triggerOf(host);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.tap();
      const panel = panelOf(host);
      await expect(panel).toBeVisible();
      await expect(panel).not.toHaveAttribute('aria-modal', 'true');

      await trigger.tap();
      await page.keyboard.type('Ro');
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveValue('Ro');
      await expect(panel.getByRole('option', { name: 'Rome', exact: true })).toBeVisible();
      await expect(panel.getByRole('option', { name: 'Athens', exact: true })).toHaveCount(0);
    });
  }
});

// The project runs Desktop Chrome, a fine pointer: no touch floor.
test.describe('select summary trigger on a desktop pointer', () => {
  for (const variant of VARIANTS) {
    test(`${variant.host} keeps the chips`, async ({ page }) => {
      await gotoDemo(page, ALL);
      const host = page.locator(variant.host).first();
      await pickThree(page, host, variant, false);
      const row = rowBoxOf(host);
      await expect(row.locator('cngx-chip')).toHaveCount(3);
      await expect(row.locator('cngx-select-summary')).toHaveCount(0);
    });
  }
});
