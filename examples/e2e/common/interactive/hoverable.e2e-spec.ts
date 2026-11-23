import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxHoverable exposes a pointer hover signal. The basic demo ORs in
// a focus signal so the highlight also follows keyboard focus.

test.describe('common/interactive/hoverable', () => {
  test('basic: pointer hover and keyboard focus both highlight the target', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/hoverable/basic');

    const target = page.getByRole('button', { name: 'Hover or focus me' });
    const valueOf = (label: string) =>
      page
        .locator('.event-row')
        .filter({ has: page.getByText(label, { exact: true }) })
        .locator('.event-value');

    await expect(valueOf('hovered()')).toHaveText('false');
    await target.hover();
    await expect(valueOf('hovered()')).toHaveText('true');
    await expect(target).toHaveClass(/demo-hoverable-target--active/);

    await page.mouse.move(0, 0);
    await expect(valueOf('hovered()')).toHaveText('false');
    await expect(target).not.toHaveClass(/demo-hoverable-target--active/);

    await target.focus();
    await expect(valueOf('focused')).toHaveText('true');
    await expect(valueOf('hovered()')).toHaveText('false');
    await expect(target).toHaveClass(/demo-hoverable-target--active/);
  });

  test('as-host-directive: each composed card tracks its own hover', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/hoverable/as-host-directive');

    const cards = page.locator('demo-hover-card');
    await expect(cards).toHaveCount(3);
    await cards.nth(1).hover();
    await expect(cards.nth(1)).toHaveClass(/demo-hover-card--active/);
    await expect(cards.nth(0)).not.toHaveClass(/demo-hover-card--active/);
    await expect(cards.nth(1).locator('.demo-hover-card__state')).toHaveText('hovered');
  });
});
