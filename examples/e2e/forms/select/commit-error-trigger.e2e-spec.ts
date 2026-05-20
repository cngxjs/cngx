import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// CSS-only Pillar-2 visual layer added by `feat(forms/select): add
// trigger-surface invalid-state CSS + four theming tokens`. Without an
// in-browser repro the rule could silently die under a `--cngx-color-danger`
// override or a `:has()` regression on the input-based variants. One spec
// exercises the reorderable demo because its commit lifecycle is the most
// reliable way to flip `aria-invalid` from `null` to `'true'` and back
// without authoring an extra story.
const ROUTE =
  'forms/select/reorderable-multi-select/commit-action-optimistic-pessimistic-with-supersede';

test.describe('CngxReorderableMultiSelect — trigger border on commit error', () => {
  test('paints danger border on commit failure; clears on subsequent success', async ({
    page,
  }) => {
    await gotoDemo(page, ROUTE);

    const trigger = page.locator('.cngx-reorderable-multi-select__trigger');
    await expect(trigger).toBeVisible();
    await expect(trigger).not.toHaveAttribute('aria-invalid', 'true');

    // Resolve the live `--cngx-color-danger` against the running theme so the
    // border-color comparison survives dark-mode flips and consumer overrides.
    const dangerColor = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.color = 'var(--cngx-color-danger)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(dangerColor).not.toBe('');

    // Optimistic is the demo default. Toggling Server fails on makes the next
    // reorder reject from the demo's commitAction stub.
    await page.getByLabel('Server fails').check();

    const firstChip = page.locator('[data-reorder-index="0"]').first();
    await firstChip.focus();
    await firstChip.press('Alt+ArrowDown');

    // Commit settles after ~700ms in the story stub.
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');

    const invalidBorderColor = await trigger.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderTopColor,
    );
    expect(invalidBorderColor).toBe(dangerColor);

    // Untoggle Server fails and reorder again — commit succeeds, the trigger
    // returns to the neutral border so the visual signal can't get stuck.
    await page.getByLabel('Server fails').uncheck();

    await firstChip.focus();
    await firstChip.press('Alt+ArrowDown');

    await expect(trigger).not.toHaveAttribute('aria-invalid', 'true');

    const restoredBorderColor = await trigger.evaluate(
      (el) => getComputedStyle(el as HTMLElement).borderTopColor,
    );
    expect(restoredBorderColor).not.toBe(dangerColor);
  });
});
