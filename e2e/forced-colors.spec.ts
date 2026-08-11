import { expect, test, type Locator } from '@playwright/test';

// Forced-colors (Windows High Contrast Mode) smoke. The static coverage guard
// (forced-colors-coverage.spec.ts) proves each component ships an
// `@media (forced-colors: active)` block; only a real forced-colors render
// proves the boundary actually resolves. Under `forcedColors: 'active'` the UA
// forces color / background-color / border-color / outline-color to system
// colours (including `transparent`) and `box-shadow` to `none`, so the
// computed-style reads below reflect the real forcing.
//
// Two halves, matching the re-aimed WHCM model:
//   - Re-drawn breaks: a chip (borderless tint), a radio's checked dot and a
//     badge's --dot (background-drawn), and a divider (background-drawn line)
//     all collapse to Canvas without a block; each Phase-A block re-draws the
//     boundary with a system colour, asserted here as "distinct from Canvas"
//     or "opaque forced border".
//   - Self-heal controls: a checkbox box (currentColor border) and a tag
//     (1px transparent border) need NO block - the UA forces their edge to an
//     opaque system colour on its own. Asserted so the suite documents that
//     transparent/coloured borders are deliberately left alone.
//
// Chromium-only: forced-colors system-colour resolution under emulation is
// reliable there (the plan's empirical basis); Firefox/WebKit emulation does
// not resolve the keyword palette the same way.
//
// The forcing is applied per page via `emulateMedia({ forcedColors: 'active' })`
// after navigation, NOT the context-level `use({ forcedColors })` option: in
// this Chromium build the context option leaves `matchMedia('(forced-colors:
// active)')` false (no repaint), whereas the imperative call activates both the
// media query and the system-colour repaint (verified: a transparent border
// resolves to `rgb(0, 0, 0)`, a background to an opaque system colour).

test.describe('forced-colors (WHCM) affordance survival', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'forced-colors system-colour resolution is asserted in Chromium only',
  );

  // Force WHCM BEFORE navigating so the page renders under the forced palette
  // from first paint. emulateMedia is page-scoped and persists across the goto;
  // setting it after navigation instead leaves a recompute race that flakes
  // under the parallel worker pool.
  const openForced = async (
    page: import('@playwright/test').Page,
    url: string,
  ): Promise<void> => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(url);
  };

  // Read the element's forced computed colours plus a live Canvas / CanvasText
  // reference probed in the same document, so "distinct from Canvas" is a real
  // comparison rather than a hardcoded palette guess.
  const readAffordance = (locator: Locator) =>
    locator.evaluate((el) => {
      const cs = getComputedStyle(el as Element);
      const probe = document.createElement('span');
      probe.style.color = 'CanvasText';
      probe.style.backgroundColor = 'Canvas';
      document.body.appendChild(probe);
      const ps = getComputedStyle(probe);
      const canvas = ps.backgroundColor;
      const canvasText = ps.color;
      probe.style.backgroundColor = 'Highlight';
      const highlight = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        borderTopWidth: cs.borderTopWidth,
        borderTopStyle: cs.borderTopStyle,
        canvas,
        canvasText,
        highlight,
      };
    });

  // Opaque = not `transparent` and not an `rgba(...)` whose FOURTH (alpha)
  // component is 0. A 3-component `rgb(0, 0, 0)` is fully opaque even though it
  // ends in `, 0)` (that is the blue channel, not alpha).
  const isOpaque = (color: string): boolean => {
    if (color === 'transparent') return false;
    const match = color.match(/^rgba?\(([^)]+)\)$/);
    if (!match) return true;
    const parts = match[1].split(',').map((part) => part.trim());
    return parts.length < 4 || parseFloat(parts[3]) > 0;
  };

  test('chip gains a forced boundary (borderless tint would collapse to Canvas)', async ({ page }) => {
    await openForced(page, '/#/common/display/chip/basic');
    const chip = page.locator('.cngx-ex-artifact .cngx-chip').first();
    await expect(chip).toBeVisible();
    const s = await readAffordance(chip);
    expect(parseFloat(s.borderTopWidth)).toBeGreaterThan(0);
    expect(s.borderTopStyle).toBe('solid');
    expect(isOpaque(s.borderTopColor)).toBe(true);
  });

  test('radio checked dot survives (background-drawn dot would vanish)', async ({ page }) => {
    await openForced(page, '/#/common/display/radio-indicator/default-unchecked-vs-checked');
    const dot = page
      .locator('.cngx-ex-artifact .cngx-radio-indicator--checked .cngx-radio-indicator__dot')
      .first();
    await expect(dot).toBeVisible();
    const s = await readAffordance(dot);
    // Exactly CanvasText, not merely "not Canvas": a coloured dot that was
    // never forced would also differ from Canvas, so the strict equality is
    // what proves the forced re-draw actually ran.
    expect(s.backgroundColor).toBe(s.canvasText);
  });

  test('badge --dot survives (textless background-only indicator would vanish)', async ({ page }) => {
    await openForced(page, '/#/common/display/badge/colors-and-dot-mode');
    const dot = page
      .locator('button.chip', { hasText: 'Live' })
      .locator('.cngx-badge-indicator--dot')
      .first();
    await expect(dot).toBeVisible();
    const s = await readAffordance(dot);
    expect(s.backgroundColor).toBe(s.canvasText);
  });

  test('divider line survives (background-drawn separator would collapse to Canvas)', async ({ page }) => {
    await openForced(page, '/#/common/display/divider/horizontal-vs-vertical');
    const divider = page.locator('.cngx-ex-artifact cngx-divider').first();
    await expect(divider).toBeVisible();
    const s = await readAffordance(divider);
    expect(s.backgroundColor).toBe(s.canvasText);
  });

  test('checkbox box self-heals via its currentColor border (no block needed)', async ({ page }) => {
    await openForced(page, '/#/common/display/checkbox-indicator/states');
    const box = page.locator('.cngx-ex-artifact .cngx-checkbox-indicator__box').first();
    await expect(box).toBeVisible();
    const s = await readAffordance(box);
    expect(parseFloat(s.borderTopWidth)).toBeGreaterThan(0);
    expect(isOpaque(s.borderTopColor)).toBe(true);
  });

  test('tag self-heals via its 1px transparent border (forced to an opaque system colour)', async ({ page }) => {
    await openForced(page, '/#/common/display/tag/variant-matrix');
    const tag = page.locator('.cngx-ex-artifact .cngx-tag').first();
    await expect(tag).toBeVisible();
    const s = await readAffordance(tag);
    expect(parseFloat(s.borderTopWidth)).toBeGreaterThan(0);
    expect(isOpaque(s.borderTopColor)).toBe(true);
  });

  // Phase B - @cngx/common selected/checked states re-signal with Highlight.
  // These exercise the two failure modes the static guard cannot see: a base
  // `:scope.MODIFIER` rule winning the scope-proximity tiebreak, and a <button>
  // whose background the UA forces to ButtonFace. Both are why the re-signals
  // carry !important (and forced-color-adjust on the button).

  test('button-toggle checked segment fills with Highlight (button UA-forcing beaten)', async ({ page }) => {
    await openForced(page, '/#/common/interactive/button-toggle/group/basic-view-switcher');
    const checked = page.locator('.cngx-ex-artifact .cngx-button-toggle--checked').first();
    await expect(checked).toBeVisible();
    const s = await readAffordance(checked);
    expect(s.backgroundColor).toBe(s.highlight);
  });

  test('selected card re-signals with a Highlight border (base :scope rule beaten)', async ({ page }) => {
    await openForced(page, '/#/common/card/action-card-with-selection');
    const clickable = page.locator('.cngx-ex-artifact .cngx-card--interactive').first();
    await expect(clickable).toBeVisible();
    await clickable.click({ force: true });
    const card = page.locator('.cngx-ex-artifact .cngx-card--selected').first();
    await expect(card).toBeVisible();
    // The card animates border-color over 150ms; let it settle before reading so
    // the assertion sees the resolved Highlight, not a mid-transition frame.
    await page.waitForTimeout(300);
    const s = await readAffordance(card);
    expect(s.borderTopColor).toBe(s.highlight);
  });

  test('checked toggle track fills with Highlight (base :scope descendant rule beaten)', async ({ page }) => {
    await openForced(page, '/#/common/interactive/toggle/basic-two-way-binding');
    const toggle = page.locator('.cngx-ex-artifact .cngx-toggle').first();
    await expect(toggle).toBeVisible();
    await toggle.click({ force: true });
    const track = page.locator('.cngx-ex-artifact .cngx-toggle--checked .cngx-toggle__track').first();
    await expect(track).toBeVisible();
    // The track animates background over ~150ms; settle before reading.
    await page.waitForTimeout(300);
    const s = await readAffordance(track);
    expect(s.backgroundColor).toBe(s.highlight);
  });
});
