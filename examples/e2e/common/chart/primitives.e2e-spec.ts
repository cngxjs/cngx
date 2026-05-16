import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: chart/primitives stories cover the low-level building blocks.

const routes: ReadonlyArray<readonly [string, string]> = [
  ['async-state-machine', 'common/chart/primitives/async-state-machine-on-the-primitive'],
  ['combo-bars-line', 'common/chart/primitives/combo-bars-moving-average-line'],
  ['line-area-threshold', 'common/chart/primitives/line-area-threshold-band'],
  ['multi-series', 'common/chart/primitives/multi-series-line-axis-labels-legend'],
  ['responsive', 'common/chart/primitives/responsive-fills-parent-width'],
  ['scatter-zones', 'common/chart/primitives/scatter-with-performance-zones'],
  ['time-series', 'common/chart/primitives/time-series-with-threshold-zones'],
];

test.describe('common/chart/primitives', () => {
  for (const [name, route] of routes) {
    test(`${name}: page renders`, async ({ page }) => {
      await gotoDemo(page, route);
      await expect(page.locator('header.cngx-ex-intro')).toBeVisible();
      // async-state-machine starts in idle (no SVG); other stories paint
      // an SVG immediately. Smoke that the header rendered is enough.
      await expect(page).toHaveScreenshot(`primitives-${name}.png`, { fullPage: true });
    });
  }
});
