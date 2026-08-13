import { expect, test } from '@playwright/test';

// The panel writes each axis choice into the app-wide preference signal, which
// reflects onto an <html data-*> attribute; the theming CSS keys off those
// attributes. Only a real browser proves the attribute -> live-CSS path, so the
// journey is an e2e: pick an option per axis, assert the root attribute flips
// and (for text-scale) that the live root font actually grows.

test.describe('CngxA11yPanel multi-axis reflect', () => {
  test('each axis choice reflects onto the root attribute and drives live CSS', async ({
    page,
  }) => {
    await page.goto('/#/ui/a11y/panel/inline');

    const panel = page.locator('cngx-a11y-panel');
    await expect(panel).toBeVisible();
    const html = page.locator('html');

    const rootFontSize = () =>
      page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));

    const textSizeAxis = page.locator('.cngx-a11y-panel__axis', { hasText: 'Text size' });
    const motionAxis = page.locator('.cngx-a11y-panel__axis', { hasText: 'Motion' });
    const spacingAxis = page.locator('.cngx-a11y-panel__axis', { hasText: 'Spacing' });

    // Text size -> Large: attribute flips and the live root font grows.
    const fontBefore = await rootFontSize();
    await textSizeAxis.getByRole('radio', { name: 'Large' }).click();
    await expect(html).toHaveAttribute('data-text-size', 'lg');
    await expect.poll(rootFontSize).toBeGreaterThan(fontBefore);

    // Motion -> Reduced: attribute flips (the reduced-motion safety net keys off it).
    await motionAxis.getByRole('radio', { name: 'Reduced' }).click();
    await expect(html).toHaveAttribute('data-motion', 'reduced');

    // Spacing -> Compact: density attribute flips live.
    await spacingAxis.getByRole('radio', { name: 'Compact' }).click();
    await expect(html).toHaveAttribute('data-density', 'compact');

    // Reset restores every axis default; text-size drops back to md, so the root
    // font shrinks below the Large measurement.
    await page.getByRole('button', { name: 'Reset to defaults' }).click();
    await expect(html).toHaveAttribute('data-text-size', 'md');
    await expect(html).toHaveAttribute('data-density', 'comfortable');
    // motion `auto` removes the attribute entirely.
    await expect(html).not.toHaveAttribute('data-motion', /.+/);
  });
});
