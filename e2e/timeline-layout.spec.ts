import { expect, test, type Page } from '@playwright/test';

// Geometry guard for the timeline layout axis. Every assertion here is a
// computed grid track, which is exactly why it is not a unit spec: the row
// raster lives inside `@layer cngx.components` and `@scope
// (.cngx-timeline-item)`, and jsdom's CSSOM parses neither, so
// `getComputedStyle(row).gridTemplateColumns` is `''` in `ng test` no
// matter what the stylesheet says. Playwright runs a real engine, so
// `@layer`, `@scope` and `:has()` all resolve.

const NARRATIVE = '/#/ui/timeline/basics/flat-array';
const MODES = '/#/ui/timeline/skins/activity-vs-narrative';

/** v1 rasters, as the row stylesheet declares them. */
const V1_NARRATIVE_AREAS = '"marker time" "rail body"';
const V1_ACTIVITY_AREAS = '"marker body time" "rail body time"';

/**
 * Resolved track widths. Chromium reports used pixel values
 * (`"128px 24px 512px"`), so splitting on whitespace gives both the count
 * and the widths - a track count alone cannot tell `1fr auto 1fr` from
 * `auto auto 1fr`.
 */
function tracks(value: string): readonly number[] {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((track) => Number.parseFloat(track));
}

function trackCount(value: string): number {
  return tracks(value).length;
}

async function firstRow(page: Page) {
  const row = page.locator('cngx-timeline-item').first();
  await expect(row).toBeVisible();
  return row;
}

/** Grid geometry of the first rendered row, as the browser resolved it. */
async function raster(page: Page): Promise<{ columns: string; areas: string }> {
  const row = await firstRow(page);
  return row.evaluate((el) => {
    const style = getComputedStyle(el);
    return { columns: style.gridTemplateColumns, areas: style.gridTemplateAreas };
  });
}

/**
 * Stamps layout attributes onto the organism host. The row reads them off
 * an ancestor by design - that is the same opt-in v1 documents for
 * `data-mode` - so driving them directly is how a standalone row would do
 * it, and it lets the cascade be pinned before any organism input exists.
 */
async function stampOnTimeline(page: Page, attrs: Record<string, string>): Promise<void> {
  await page
    .locator('cngx-timeline')
    .first()
    .evaluate((el, pairs) => {
      for (const [name, value] of Object.entries(pairs as Record<string, string>)) {
        el.setAttribute(name, value);
      }
    }, attrs);
}

test.describe('timeline layout - v1 rasters are untouched', () => {
  test('a narrative row keeps its two-track raster', async ({ page }) => {
    await page.goto(NARRATIVE);
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(2);
    expect(areas).toBe(V1_NARRATIVE_AREAS);
  });

  test('an activity row keeps its three-track raster', async ({ page }) => {
    await page.goto(MODES);
    await page.getByRole('button', { name: 'activity', exact: true }).click();
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(3);
    expect(areas).toBe(V1_ACTIVITY_AREAS);
  });

  test('no v1 row picks up an opposite track', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('.cngx-timeline-item__opposite')).toHaveCount(0);
  });
});

test.describe('timeline layout - the opposite track is gated on markup', () => {
  // The gate keys on the projected attribute, so injecting one is enough to
  // flip the raster. The demo that projects it properly lands with the
  // organism input in the next PR; this keeps the rule from shipping with
  // nothing at all able to observe it.
  test('a row that projects opposite content gains a third track', async ({ page }) => {
    await page.goto(NARRATIVE);
    const row = await firstRow(page);
    await row.evaluate((el) => {
      const span = document.createElement('span');
      span.setAttribute('cngxTimelineOpposite', '');
      span.className = 'cngx-timeline-item__opposite';
      span.textContent = '2019';
      el.append(span);
    });
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(3);
    expect(areas).toBe('"opposite marker time" "opposite rail body"');
  });

  // The gate has to match the same set `<ng-content select>` projects.
  // Projection lands the node as a direct child, and only a direct child
  // can be a grid item - a descendant match would hand this row a track
  // that nothing is able to occupy.
  test('an opposite attribute nested in the body earns no track', async ({ page }) => {
    await page.goto(NARRATIVE);
    const row = await firstRow(page);
    await row.evaluate((el) => {
      const nested = document.createElement('span');
      nested.setAttribute('cngxTimelineOpposite', '');
      nested.textContent = 'not projected';
      el.querySelector('.cngx-timeline-item__body')?.append(nested);
    });
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(2);
    expect(areas).toBe(V1_NARRATIVE_AREAS);
  });
});

test.describe('timeline layout - locked cascade ties', () => {
  // [data-mode='activity'] .cngx-timeline-item and [data-row-side='end']
  // .cngx-timeline-item both land at (0,2,0). Without a selector naming
  // both, which one paints an activity row on the end side is decided by
  // stylesheet source order.
  test('activity x row-side=end resolves to the mirrored activity raster', async ({ page }) => {
    await page.goto(MODES);
    await page.getByRole('button', { name: 'activity', exact: true }).click();
    await stampOnTimeline(page, { 'data-row-side': 'end' });
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(3);
    expect(areas).toBe('"time body marker" "time body rail"');
  });

  // Alternating a scan-feed defeats the scan, so activity renders `start`.
  // The exclusion is in the selector, not in source order - this pins it.
  test('activity x alternate resolves to the plain start raster', async ({ page }) => {
    await page.goto(MODES);
    await page.getByRole('button', { name: 'activity', exact: true }).click();
    await stampOnTimeline(page, { 'data-placement': 'alternate' });
    const { areas } = await raster(page);

    expect(areas).toBe(V1_ACTIVITY_AREAS);
  });

  test('narrative x alternate does centre the rail on symmetric tracks', async ({ page }) => {
    await page.goto(NARRATIVE);
    await stampOnTimeline(page, { 'data-placement': 'alternate' });
    const { columns, areas } = await raster(page);
    const [lead, , trail] = tracks(columns);

    expect(trackCount(columns)).toBe(3);
    expect(areas).toBe('"opposite marker time" "opposite rail body"');
    // The rail is centred only when the two outer tracks resolve equal.
    // A track count alone passes on `auto auto 1fr`, which is the raster
    // this test exists to distinguish itself from.
    expect(lead).toBeCloseTo(trail, 1);
  });

  test('narrative x row-side=end mirrors tracks and areas', async ({ page }) => {
    await page.goto(NARRATIVE);
    await stampOnTimeline(page, { 'data-row-side': 'end' });
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(2);
    expect(areas).toBe('"time marker" "body rail"');
  });
});
