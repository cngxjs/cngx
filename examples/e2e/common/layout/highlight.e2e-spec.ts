import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxHighlight wraps text-node matches of a search term in <mark>
// elements (no innerHTML rewrites). matchCount() exposes the live count.
//
// Note: Angular strips the structural-directive attribute binding, so the
// host element is not addressable via `[cngxHighlight]`. Locate it by
// stable text or structural position instead.

test.describe('common/layout/highlight', () => {
  test('live-search: typing a term wraps matches and updates matchCount', async ({ page }) => {
    await gotoDemo(page, 'common/layout/highlight/live-search-highlighting');

    // The directive host is the only div with inline `line-height: 1.8`.
    const host = page.locator('div[style*="line-height"]').first();
    await expect(host).toContainText('Angular Signals represent');

    const input = page.getByPlaceholder('Type to highlight...');
    const reportedCount = page
      .locator('.event-row')
      .filter({ has: page.getByText('Match count', { exact: true }) })
      .locator('.event-value');

    // Empty term → no marks inside the host, reportedCount is 0.
    await expect(reportedCount).toHaveText('0');
    await expect(host.locator('mark')).toHaveCount(0);

    await input.fill('signal');
    // The substring "signal" lives in "Signals" and "signals" — case-insensitive
    // gives 2 matches. The matchCount signal and the DOM <mark> count under
    // the host must agree.
    const renderedMarks = await host.locator('mark').count();
    expect(renderedMarks).toBeGreaterThan(0);
    await expect(reportedCount).toHaveText(String(renderedMarks));

    // Clearing the input removes the marks.
    await input.fill('');
    await expect(host.locator('mark')).toHaveCount(0);

  });

  test('multiple-paragraphs: static term marks matches across sibling paragraphs', async ({
    page,
  }) => {
    await gotoDemo(page, 'common/layout/highlight/multiple-paragraphs');

    const host = page.locator('div[style*="max-width"]').filter({
      hasText: 'Angular is a platform',
    });
    await expect(host).toBeVisible();

    const marks = host.locator('mark');
    const matchCount = await marks.count();
    // Demo text contains "Angular" 4 times across 3 <p>s, all matching.
    expect(matchCount).toBe(4);

    const paragraphsWithMarks = await host.locator('p:has(mark)').count();
    expect(paragraphsWithMarks).toBe(3);

    const reported = page
      .locator('.event-row')
      .filter({ has: page.getByText('Matches for', { exact: false }) })
      .locator('.event-value');
    await expect(reported).toHaveText('4');

  });
});
