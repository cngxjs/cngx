import { expect, test, type Page } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxScrollEdges reflects which edges of a scrollport still hide
// content. The readout mirrors the four signals; the box is a sheet that
// overflows in both axes.

const ROUTE = 'common/layout/scroll-edges/edge-shadows';
const BOX = '[cngxscrolledges]';

function readout(page: Page, label: string) {
  return page
    .locator('.event-row')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('.event-value');
}

async function scrollBox(page: Page, left: number | 'end' | 'rtl-end', top: number | 'end') {
  await page.locator(BOX).evaluate(
    (box, [l, t]) => {
      const maxLeft = box.scrollWidth - box.clientWidth;
      const maxTop = box.scrollHeight - box.clientHeight;
      const resolvedLeft = l === 'end' ? maxLeft : l === 'rtl-end' ? -maxLeft : l;
      const resolvedTop = t === 'end' ? maxTop : t;
      box.scrollTo({ left: resolvedLeft, top: resolvedTop, behavior: 'instant' });
    },
    [left, top] as const,
  );
}

test.describe('common/layout/scroll-edges', () => {
  test('edge-shadows: the readout follows the scroll position', async ({ page }) => {
    await gotoDemo(page, ROUTE);
    const box = page.locator(BOX);

    await expect(readout(page, 'canScrollBlockStart')).toHaveText('false');
    await expect(readout(page, 'canScrollBlockEnd')).toHaveText('true');
    await expect(readout(page, 'canScrollInlineStart')).toHaveText('false');
    await expect(readout(page, 'canScrollInlineEnd')).toHaveText('true');
    await expect(box).toHaveAttribute('data-scroll-block-end', '');
    await expect(box).not.toHaveAttribute('data-scroll-block-start');

    await scrollBox(page, 'end', 'end');

    await expect(readout(page, 'canScrollBlockStart')).toHaveText('true');
    await expect(readout(page, 'canScrollBlockEnd')).toHaveText('false');
    await expect(readout(page, 'canScrollInlineStart')).toHaveText('true');
    await expect(readout(page, 'canScrollInlineEnd')).toHaveText('false');
    await expect(box).toHaveAttribute('data-scroll-inline-start', '');
    await expect(box).not.toHaveAttribute('data-scroll-inline-end');
  });

  test('edge-shadows: RTL keeps start / end semantics', async ({ page }) => {
    await gotoDemo(page, ROUTE);

    await page.getByRole('radio', { name: 'RTL' }).check();
    await expect(page.locator('.demo-scroll-edges-frame')).toHaveAttribute('dir', 'rtl');
    await scrollBox(page, 0, 0);

    await expect(readout(page, 'canScrollInlineStart')).toHaveText('false');
    await expect(readout(page, 'canScrollInlineEnd')).toHaveText('true');

    // In RTL the end edge is on the left, reached with a negative scrollLeft.
    await scrollBox(page, 'rtl-end', 0);

    await expect(readout(page, 'canScrollInlineStart')).toHaveText('true');
    await expect(readout(page, 'canScrollInlineEnd')).toHaveText('false');
  });
});
