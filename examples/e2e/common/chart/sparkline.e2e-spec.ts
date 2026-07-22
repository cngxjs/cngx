import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxSparkline composes <cngx-chart> + <cngx-line> (+ optional
// area). The host renders as role="img" via the chart wrapper; the data
// table mirrors the values for AT.

test.describe('common/chart/sparkline', () => {
  test('basic-sparklines: three sparklines with distinct data series', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/basic-sparklines');

    const sparklines = page.locator('cngx-sparkline');
    await expect(sparklines).toHaveCount(3);

    // Each sparkline composes a chart with a line path.
    for (let i = 0; i < 3; i++) {
      const s = sparklines.nth(i);
      await expect(s.locator('svg path.cngx-line')).toHaveCount(1);
    }

  });

  test('with-area-fill: line + filled area both render', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/with-area-fill');

    const sparkline = page.locator('cngx-sparkline').first();
    await expect(sparkline.locator('svg path.cngx-line')).toHaveCount(1);
    await expect(sparkline.locator('svg path.cngx-area')).toHaveCount(1);

  });

  test('async-state-machine: status follows the state controls', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/async-state-machine');

    const status = page.getByText(/^\s*status:/);
    await expect(status).toContainText('idle');

    await page.getByRole('button', { name: 'success' }).click();
    await expect(status).toContainText('success');
    await expect(page.locator('cngx-sparkline svg path.cngx-line')).toHaveCount(1);

    await page.getByRole('button', { name: 'error' }).click();
    await expect(status).toContainText('error');

  });

  test('sr-only data table is contained by its chart host, not the document', async ({ page }) => {
    await gotoDemo(page, 'common/chart/sparkline/basic-sparklines');
    await expect(page.locator('cngx-sparkline')).toHaveCount(3);

    // The SR-only <cngx-chart-data-table> is position:absolute. Its containing
    // block must be the <cngx-chart> host (position:relative), not the initial
    // containing block. If the host were static the table would escape ancestor
    // overflow clipping and inflate document scrollHeight inside a virtualized
    // list. offsetParent of an absolute element IS its containing block, so
    // asserting it equals the host proves containment directly.
    const charts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('cngx-chart')).map((chart) => {
        const table = chart.querySelector('cngx-chart-data-table') as HTMLElement | null;
        return {
          hasTable: !!table,
          chartPosition: getComputedStyle(chart as HTMLElement).position,
          tableContainedByChart: table ? table.offsetParent === chart : null,
        };
      }),
    );

    expect(charts.length).toBeGreaterThan(0);
    for (const chart of charts) {
      expect(chart.hasTable).toBe(true);
      expect(chart.chartPosition).toBe('relative');
      expect(chart.tableContainedByChart).toBe(true);
    }
  });
});
