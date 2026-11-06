import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxButtonGroup renders role="group" with data-orientation and hands
// its variant and size down to the buttons inside (an explicit button input
// wins). A nested group inherits from its parent. The separator is
// aria-hidden; the addon takes the group size. The group adds no keyboard
// model of its own (no roving tabindex), so every button keeps its Tab stop.

const BASIC = 'common/button/group/basic';
const VERTICAL = 'common/button/group/vertical';
const TOOLBAR = 'common/button/group/icon-toolbar';
const ADDON = 'common/button/group/with-addon';

test.describe('common/button/group', () => {
  test('basic: named groups hand variant and size to their buttons', async ({ page }) => {
    await gotoDemo(page, BASIC);
    const artifact = page.locator('.cngx-ex-artifact');

    const history = artifact.getByRole('group', { name: 'History' });
    await expect(history).toHaveAttribute('data-orientation', 'horizontal');
    await expect(history).not.toHaveAttribute('data-size');
    for (const name of ['Undo', 'Redo', 'Repeat']) {
      const button = history.getByRole('button', { name, exact: true });
      await expect(button).toHaveAttribute('data-variant', 'outline');
      await expect(button).toHaveAttribute('data-size', 'md');
    }

    const review = artifact.getByRole('group', { name: 'Review' });
    await expect(review).toHaveAttribute('data-size', 'sm');
    await expect(review.getByRole('button', { name: 'Approve', exact: true })).toHaveAttribute(
      'data-variant',
      'solid',
    );
    // An explicit variant on the button wins over the group.
    const reject = review.getByRole('button', { name: 'Reject' });
    await expect(reject).toHaveAttribute('data-variant', 'outline');
    await expect(reject).toHaveAttribute('data-tone', 'danger');
    await expect(reject).toHaveAttribute('data-size', 'sm');

    const clipboard = artifact.getByRole('group', { name: 'Clipboard' });
    await expect(clipboard.locator('[cngxbuttongroupseparator]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(clipboard.getByRole('button', { name: 'Paste' })).toHaveAttribute(
      'data-variant',
      'ghost',
    );
  });

  test('basic: no roving model, Tab walks every button in order', async ({ page }) => {
    await gotoDemo(page, BASIC);
    const history = page.locator('.cngx-ex-artifact').getByRole('group', { name: 'History' });

    await history.getByRole('button', { name: 'Undo' }).focus();
    await page.keyboard.press('Tab');
    await expect(history.getByRole('button', { name: 'Redo' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(history.getByRole('button', { name: 'Repeat' })).toBeFocused();
  });

  test('vertical: orientation lands as data-orientation', async ({ page }) => {
    await gotoDemo(page, VERTICAL);
    const group = page.locator('.cngx-ex-artifact').getByRole('group', { name: 'Sort by' });

    await expect(group).toHaveAttribute('data-orientation', 'vertical');
    await expect(group.getByRole('button')).toHaveCount(4);
    for (const name of ['Newest first', 'Oldest first', 'Name', 'Size']) {
      await expect(group.getByRole('button', { name, exact: true })).toHaveAttribute(
        'data-variant',
        'outline',
      );
    }
    // Stacked, not in a row.
    const first = await group.getByRole('button').nth(0).boundingBox();
    const second = await group.getByRole('button').nth(1).boundingBox();
    expect(first && second).toBeTruthy();
    expect(second!.y).toBeGreaterThan(first!.y);
  });

  test('icon-toolbar: nested groups inherit variant and size from the parent', async ({ page }) => {
    await gotoDemo(page, TOOLBAR);
    const toolbar = page
      .locator('.cngx-ex-artifact')
      .getByRole('group', { name: 'Editor actions' });

    for (const name of ['Clipboard', 'Zoom', 'History']) {
      await expect(toolbar.getByRole('group', { name, exact: true })).toHaveAttribute(
        'data-size',
        'sm',
      );
    }
    for (const name of [
      'Cut',
      'Copy',
      'Paste',
      'Zoom out',
      'Zoom in',
      'Fit to window',
      'Undo',
      'Redo',
    ]) {
      const button = toolbar.getByRole('button', { name, exact: true });
      await expect(button).toHaveAttribute('data-variant', 'outline');
      await expect(button).toHaveAttribute('data-size', 'sm');
    }
  });

  test('with-addon: the addon takes the group size', async ({ page }) => {
    await gotoDemo(page, ADDON);
    const artifact = page.locator('.cngx-ex-artifact');

    const assignee = artifact.getByRole('group', { name: 'Assignee' });
    await expect(assignee.locator('[cngxbuttongroupaddon]')).toHaveAttribute('data-size', 'md');
    await expect(assignee.locator('[cngxbuttongroupaddon]')).toContainText('Ada Lovelace');
    await expect(assignee.getByRole('button', { name: 'Reassign' })).toHaveAttribute(
      'data-variant',
      'outline',
    );

    const issues = artifact.getByRole('group', { name: 'Issues' });
    await expect(issues.locator('[cngxbuttongroupaddon]')).toHaveAttribute('data-size', 'sm');
    await expect(issues.getByRole('button', { name: 'New issue' })).toHaveAttribute(
      'data-size',
      'sm',
    );
  });
});
