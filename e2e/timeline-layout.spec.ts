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
const OPPOSITE = '/#/ui/timeline/layout/opposite-time';
const MEDIA = '/#/ui/timeline/layout/media-markers';
const INFOGRAPHIC = '/#/ui/timeline/layout/alternating-infographic';
const RAILS = '/#/ui/timeline/layout/continuous-vs-segmented';
const SKELETON = '/#/ui/timeline/async/global-loading-skeleton';

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
  test('a row that projects opposite content gains a third track', async ({ page }) => {
    await page.goto(OPPOSITE);
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(3);
    expect(areas).toBe('"opposite marker time" "opposite rail body"');
    await expect(page.locator('.cngx-timeline-item__opposite').first()).toBeVisible();
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

test.describe('timeline layout - the marker media sizing contract', () => {
  /** Rendered width of a marker and of the element projected into it. */
  async function markerAndChild(page: Page, childSelector: string) {
    return page.evaluate((selector) => {
      const marker = document.querySelector(`cngx-timeline-marker:has(> ${selector})`);
      const child = marker?.firstElementChild;
      if (!marker || !child) {
        throw new Error(`no marker holding ${selector}`);
      }
      return {
        marker: marker.getBoundingClientRect().width,
        child: child.getBoundingClientRect().width,
      };
    }, childSelector);
  }

  test('a bare img fills the marker, so it follows the marker token alone', async ({ page }) => {
    await page.goto(MEDIA);
    await expect(page.locator('cngx-timeline-marker > img').first()).toBeVisible();
    const { marker, child } = await markerAndChild(page, 'img');

    expect(child).toBeCloseTo(marker, 0);
  });

  test('a bare svg insets to the glyph token instead of filling', async ({ page }) => {
    await page.goto(MEDIA);
    await expect(page.locator('cngx-timeline-marker > svg').first()).toBeVisible();
    const { marker, child } = await markerAndChild(page, 'svg');

    // --cngx-timeline-marker-glyph-size, 60% of the dot.
    expect(child).toBeCloseTo(marker * 0.6, 0);
  });

  // The contract the README states as a rule: enlarging a marker that holds
  // an atom means setting the marker token AND the atom's own size. Nothing
  // enforces the pairing at runtime, so the demo that teaches it is also
  // what pins it.
  test('a projected avatar sized alongside the marker matches it', async ({ page }) => {
    await page.goto(MEDIA);
    await expect(page.locator('cngx-timeline-marker > cngx-avatar').first()).toBeVisible();
    const { marker, child } = await markerAndChild(page, 'cngx-avatar');

    expect(child).toBeCloseTo(marker, 0);
  });

  test('a projected icon takes its size from its own token, not the marker', async ({ page }) => {
    await page.goto(MEDIA);
    await expect(page.locator('cngx-timeline-marker > cngx-icon').first()).toBeVisible();
    const { marker, child } = await markerAndChild(page, 'cngx-icon');

    // Half the dot here, because the story pins --cngx-icon-size directly.
    // An atom that silently tracked the marker token would fail this.
    expect(child).toBeLessThan(marker * 0.75);
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
    expect(areas).toBe('"opposite marker body" "time rail body"');
    // The rail is centred only when the two outer tracks resolve equal.
    // A track count alone passes on `auto auto 1fr`, which is the raster
    // this test exists to distinguish itself from.
    expect(lead).toBeCloseTo(trail, 1);
  });

  // The degrade depends on a bare `container-name` string that @cngx/ui's
  // organism declares and @cngx/common's row queries. Nothing in either
  // language checks that the two agree, so a rename would silently disable
  // the collapse. This is the check that turns it into a failing test.
  test('alternate collapses to the start raster below the 32rem container', async ({ page }) => {
    await page.goto(NARRATIVE);
    await stampOnTimeline(page, { 'data-placement': 'alternate' });

    // Both sides of the boundary with room to spare, so the test says
    // "the query fires" rather than sitting on the threshold itself.
    await page.setViewportSize({ width: 1280, height: 900 });
    const wide = await raster(page);
    expect(trackCount(wide.columns)).toBe(3);

    await page.setViewportSize({ width: 420, height: 900 });
    const narrow = await raster(page);

    expect(trackCount(narrow.columns)).toBe(2);
    expect(narrow.areas).toBe(V1_NARRATIVE_AREAS);
  });

  test('narrative x row-side=end mirrors tracks and areas', async ({ page }) => {
    await page.goto(NARRATIVE);
    await stampOnTimeline(page, { 'data-row-side': 'end' });
    const { columns, areas } = await raster(page);

    expect(trackCount(columns)).toBe(2);
    expect(areas).toBe('"time marker" "body rail"');
  });
});

test.describe('timeline layout - the organism drives the raster', () => {
  test('alternate flips the body side row by row, from the loop index', async ({ page }) => {
    await page.goto(INFOGRAPHIC);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();

    const rowSides = await page
      .locator('.cngx-timeline__item')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-row-side')));

    expect(rowSides).toEqual(['start', 'end', 'start', 'end']);
  });

  test('the alternating rows resolve to mirrored three-track rasters', async ({ page }) => {
    await page.goto(INFOGRAPHIC);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();

    const rasters = await page
      .locator('cngx-timeline-item')
      .evaluateAll((rows) => rows.map((row) => getComputedStyle(row).gridTemplateAreas));

    // The body spans both rows so a card and its year share a top edge.
    expect(rasters[0]).toBe('"opposite marker body" "time rail body"');
    expect(rasters[1]).toBe('"body marker opposite" "body rail time"');
  });

  test('the centred rail lands on the same axis for every row', async ({ page }) => {
    await page.goto(INFOGRAPHIC);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();

    // The whole point of the symmetric tracks: a row that carries a long
    // body and a row that carries a short one still share a rail axis.
    const centres = await page.locator('cngx-timeline-connector').evaluateAll((rails) =>
      rails.map((rail) => {
        const box = rail.getBoundingClientRect();
        return Math.round(box.left + box.width / 2);
      }),
    );

    expect(new Set(centres).size).toBe(1);
  });

  test('a continuous rail keeps each segment its own status colour', async ({ page }) => {
    await page.goto(RAILS);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();

    const colours = await page
      .locator('cngx-timeline-connector')
      .evaluateAll((rails) => rails.map((rail) => getComputedStyle(rail).borderInlineStartColor));

    // Two done, two rejected, one upcoming: continuity must not flatten
    // that into one line of one colour, which a container-level rail would.
    expect(new Set(colours).size).toBeGreaterThan(1);
  });

  test('continuous stretches every segment but the last of a band', async ({ page }) => {
    await page.goto(RAILS);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();

    const heights = await page.locator('cngx-timeline-item').evaluateAll((rows) =>
      rows.map((row) => {
        const rail = row.querySelector('cngx-timeline-connector');
        return {
          position: rail?.getAttribute('data-position') ?? null,
          overshoot: Math.round(
            (rail?.getBoundingClientRect().bottom ?? 0) - row.getBoundingClientRect().bottom,
          ),
        };
      }),
    );

    for (const { position, overshoot } of heights) {
      if (position === 'last' || position === 'only') {
        expect(overshoot).toBeLessThanOrEqual(0);
      } else {
        // Bridges the inter-row gap to reach the next marker.
        expect(overshoot).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('timeline layout - the skeleton does not reflow into content', () => {
  test('placeholder rows mirror the sides the content rows will take', async ({ page }) => {
    await page.goto(SKELETON);
    // The story starts idle and loads on demand, so drive it the way a user
    // would rather than reaching into the component.
    await page.getByRole('button', { name: 'load', exact: false }).first().click();

    const placeholder = page.locator('.cngx-timeline__skeleton-row');
    await expect(placeholder.first()).toBeVisible();

    const sides = await placeholder.evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-row-side')),
    );

    // placement defaults to start on this story, so every placeholder does
    // too - the point is that the attribute is derived at all, from the
    // index the skeleton container passes into the placeholder template.
    expect(sides.every((side) => side === 'start')).toBe(true);
    expect(sides.length).toBeGreaterThan(0);
  });
});

// The HIGH-risk gate for the horizontal axis. It runs before any organism
// input or horizontal story exists: the attributes are inherited and read by
// descendant selectors, so stamping them on a v1 story's host is exactly the
// standalone opt-in v1 already documents for `data-mode`. If this does not go
// green, `orientation` does not ship and Phases 1 and 2 stand on their own.
test.describe('timeline layout - the horizontal axis, driven standalone', () => {
  async function railStyle(page: Page) {
    return page
      .locator('cngx-timeline-connector')
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          blockStartWidth: Math.round(Number.parseFloat(s.borderBlockStartWidth)),
          inlineStartWidth: Math.round(Number.parseFloat(s.borderInlineStartWidth)),
          width: Math.round(el.getBoundingClientRect().width),
          height: Math.round(el.getBoundingClientRect().height),
        };
      });
  }

  test('the vertical rail is a block-axis line before anything is stamped', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();
    const rail = await railStyle(page);

    expect(rail.inlineStartWidth).toBeGreaterThan(0);
    expect(rail.blockStartWidth).toBe(0);
    expect(rail.height).toBeGreaterThan(rail.width);
  });

  test('stamping data-orientation flips the rail onto the inline axis', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();
    await stampOnTimeline(page, { 'data-orientation': 'horizontal' });
    const rail = await railStyle(page);

    expect(rail.blockStartWidth).toBeGreaterThan(0);
    expect(rail.inlineStartWidth).toBe(0);
    expect(rail.width).toBeGreaterThan(rail.height);
  });

  test('stamping data-orientation transposes the row raster', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();
    await stampOnTimeline(page, { 'data-orientation': 'horizontal' });
    const { areas } = await raster(page);

    expect(areas).toBe('"marker rail" "time time" "body body"');
  });

  test('row-side end moves the body before the axis instead of after it', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();
    await stampOnTimeline(page, { 'data-orientation': 'horizontal', 'data-row-side': 'end' });
    const { areas } = await raster(page);

    expect(areas).toBe('"body body" "time time" "marker rail"');
  });

  // The reason the two axes are separate copies of one ladder rather than
  // steps in it: orientation must combine with placement, not out-rank it.
  test('horizontal combines with alternate rather than cancelling it', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();
    await stampOnTimeline(page, {
      'data-orientation': 'horizontal',
      'data-placement': 'alternate',
    });
    const { areas } = await raster(page);

    expect(areas).toBe('"opposite time" "marker rail" "body body"');
  });

  test('activity has no horizontal variant and falls through to the axis raster', async ({
    page,
  }) => {
    await page.goto(MODES);
    await page.getByRole('button', { name: 'activity', exact: true }).click();
    await stampOnTimeline(page, { 'data-orientation': 'horizontal' });
    const { areas } = await raster(page);

    expect(areas).toBe('"marker rail" "time time" "body body"');
  });

  test('the vertical width degrade does not fire on the horizontal axis', async ({ page }) => {
    await page.goto(NARRATIVE);
    await expect(page.locator('cngx-timeline-item').first()).toBeVisible();
    await stampOnTimeline(page, {
      'data-orientation': 'horizontal',
      'data-placement': 'alternate',
    });
    await page.setViewportSize({ width: 420, height: 900 });
    const { areas } = await raster(page);

    // Collapsing two side-by-side prose columns is a vertical-axis concern.
    // Horizontally the content already stacks, so there is nothing to fold.
    expect(areas).toBe('"opposite time" "marker rail" "body body"');
  });
});
