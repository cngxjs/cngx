import { expect, test, type Locator, type Page } from '@playwright/test';

// Forced-colors (Windows High Contrast Mode) smoke for the select family's I5
// and further-C findings. Runs the real forced palette, not the static
// coverage guard. `e2e/forced-colors.spec.ts` (strand A) owns the trigger and
// the active-row Highlight plate; this spec owns:
//   - I5: a selected-but-not-active option must stay distinguishable from the
//     active row - a 2px CanvasText inline-start bar - and the active row
//     carries a HighlightText outline inside its plate.
//   - further C: a disabled reorder move button fades to GrayText, the system
//     colour for a disabled control (today it inherits CanvasText).
//   - verify first: the select family's own forced-colors rule paints the
//     highlighted flat option and the shell option in the Highlight pair
//     without relying on the common listbox stylesheet.
// Red cases are `test.fail` until Phase 2 flips them.
//
// Chromium-only: forced-colors system-colour resolution under emulation is
// reliable there; Firefox/WebKit emulation does not resolve the keyword
// palette the same way.

test.describe('select forced-colors (WHCM) row paint', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'forced-colors system-colour resolution is asserted in Chromium only',
  );

  const openForced = async (page: Page, url: string): Promise<void> => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(url);
  };

  // Resolve the system-colour palette once in the page, so assertions compare
  // against live keywords rather than hardcoded values.
  const systemColours = (page: Page) =>
    page.evaluate(() => {
      const read = (value: string): string => {
        const probe = document.createElement('span');
        probe.style.color = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      return {
        canvasText: read('CanvasText'),
        grayText: read('GrayText'),
        highlightText: read('HighlightText'),
        highlight: (() => {
          const probe = document.createElement('span');
          probe.style.backgroundColor = 'Highlight';
          document.body.appendChild(probe);
          const value = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return value;
        })(),
      };
    });

  const style = (locator: Locator, properties: readonly string[]) =>
    locator.evaluate((el, props) => {
      const cs = getComputedStyle(el as Element);
      return Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)]));
    }, properties);

  async function openPanel(page: Page, triggerSelector = '.cngx-select__trigger'): Promise<void> {
    const trigger = page.locator(`.cngx-ex-artifact ${triggerSelector}`).first();
    await expect(trigger).toBeVisible();
    await trigger.click();
  }

  // I5 - selected-but-not-active option keeps a 2px CanvasText inline-start
  // bar. The route pre-seeds several values, so a selected-not-active row is on
  // screen as soon as the panel opens (no fragile click sequence).
  test('a selected, not active option keeps a CanvasText inline-start bar', async ({ page }) => {
    await openForced(page, '/#/forms/select/multi-select/multi-chip-overflow-truncate');
    await openPanel(page, '.cngx-multi-select__trigger');
    const selected = page
      .locator('.cngx-ex-artifact .cngx-select__option--selected:not(.cngx-option--highlighted)')
      .first();
    await expect(selected).toBeVisible();
    const sys = await systemColours(page);
    const s = await style(selected, ['border-inline-start-width', 'border-inline-start-color']);
    expect(parseFloat(s['border-inline-start-width'])).toBeGreaterThanOrEqual(2);
    expect(s['border-inline-start-color']).toBe(sys.canvasText);
  });

  // I5 - the active row carries a HighlightText outline inside its Highlight plate.
  test('the active option row draws a HighlightText outline inside its plate', async ({ page }) => {
    await openForced(page, '/#/forms/select/single-select/clearable');
    await openPanel(page);
    await page.keyboard.press('ArrowDown');
    const active = page.locator('.cngx-ex-artifact .cngx-option--highlighted').first();
    await expect(active).toBeVisible();
    const sys = await systemColours(page);
    const s = await style(active, ['outline-style', 'outline-color']);
    expect(s['outline-style']).toBe('solid');
    expect(s['outline-color']).toBe(sys.highlightText);
  });

  // further C - a disabled reorder move button fades to GrayText.
  test.fail('a disabled reorder move button computes GrayText', async ({ page }) => {
    await openForced(page, '/#/forms/select/reorderable-multi-select/pre-seeded-values-reorder-log');
    await openPanel(page);
    const disabledMove = page
      .locator('.cngx-ex-artifact .cngx-select-reorder-list__move[aria-disabled="true"]')
      .first();
    await expect(disabledMove).toBeVisible();
    const sys = await systemColours(page);
    const s = await style(disabledMove, ['color']);
    expect(s['color']).toBe(sys.grayText);
  });

  // verify first - the select family's own rule paints the highlighted flat
  // option in the Highlight pair (ownership independent of the listbox CSS).
  test('a flat select option highlights with the Highlight pair', async ({ page }) => {
    await openForced(page, '/#/forms/select/single-select/clearable');
    await openPanel(page);
    await page.keyboard.press('ArrowDown');
    const active = page.locator('.cngx-ex-artifact .cngx-option--highlighted').first();
    await expect(active).toBeVisible();
    const sys = await systemColours(page);
    const s = await style(active, ['background-color', 'color']);
    expect(s['background-color']).toBe(sys.highlight);
    expect(s['color']).toBe(sys.highlightText);
  });

  // Red: the shell projects declarative `<cngx-option>` hosts, which the
  // select-base forced-colors rule (`.cngx-select__option.cngx-option--highlighted`)
  // does not match, so the row keeps its author tint. Phase 2 commit 2.15 extends
  // the rule to the declarative host class.
  test.fail('a shell option highlights with the Highlight pair', async ({ page }) => {
    await openForced(page, '/#/forms/select/select-shell/basic-flat-declarative-options');
    await openPanel(page, '.cngx-select-shell__trigger');
    await page.keyboard.press('ArrowDown');
    const active = page.locator('.cngx-ex-artifact .cngx-option--highlighted').first();
    await expect(active).toBeVisible();
    const sys = await systemColours(page);
    const s = await style(active, ['background-color', 'color']);
    expect(s['background-color']).toBe(sys.highlight);
    expect(s['color']).toBe(sys.highlightText);
  });
});
