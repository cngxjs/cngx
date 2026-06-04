import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxMiniArea is a sibling of <cngx-sparkline> that renders only
// the filled-area path — no line stroke. SVG dimensions follow [width]
// + [height] inputs.

test.describe('common/chart/mini-area', () => {
  test('inline-area-trends: two areas with explicit and default sizes', async ({ page }) => {
    await gotoDemo(page, 'common/chart/mini-area/inline-area-trends');

    const areas = page.locator('cngx-mini-area');
    await expect(areas).toHaveCount(2);

    // First area uses defaults — must render an SVG with a fill path.
    const first = areas.first();
    await expect(first.locator('svg')).toHaveCount(1);
    // CngxMiniArea composes CngxChart + the area renderer; the path
    // class is `cngx-area`, applied inside the chart's SVG.
    await expect(first.locator('svg path.cngx-area')).toHaveCount(1);

    // Second area applies width=120, height=32 — the chart wraps the SVG
    // in a <cngx-chart> host that sizes it via inline style, and the SVG
    // itself carries the matching viewBox.
    const secondSvg = areas.nth(1).locator('svg');
    await expect(secondSvg).toHaveAttribute('viewBox', '0 0 120 32');

  });

  test('async-state-machine: status follows the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/mini-area/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    await expect(page.locator('cngx-mini-area svg')).toHaveCount(1);

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });
});
