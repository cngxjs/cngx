import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxDonut renders an SVG circular gauge with role="meter".
// The track + fill circles share the same radius; the fill's
// stroke-dasharray encodes the value/max ratio.

test.describe('common/chart/donut', () => {
  test('score-gauges: four sized donuts render as accessible meters', async ({ page }) => {
    await gotoDemo(page, 'common/chart/donut/score-gauges');

    const donuts = page.locator('cngx-donut');
    await expect(donuts).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const d = donuts.nth(i);
      // SVG track + fill must both exist for the donut to read as a gauge.
      await expect(d.locator('svg .cngx-donut__track')).toHaveCount(1);
      await expect(d.locator('svg .cngx-donut__fill')).toHaveCount(1);
    }

    // Sizes: 48, 64, 80, 64 — must apply to the SVG viewport.
    const sizes = await donuts.evaluateAll((els) =>
      els.map((el) => {
        const svg = el.querySelector('svg') as SVGSVGElement | null;
        return svg ? { w: svg.getAttribute('width'), h: svg.getAttribute('height') } : null;
      }),
    );
    expect(sizes).toEqual([
      { w: '48', h: '48' },
      { w: '64', h: '64' },
      { w: '80', h: '80' },
      { w: '64', h: '64' },
    ]);

    await expect(donuts.first()).toHaveAttribute('aria-label', /Score 75/);

  });

  test('async-state-machine: status follows the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/donut/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    // After success the donut SVG must be rendered.
    await expect(page.locator('cngx-donut svg')).toHaveCount(1);

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });
});
