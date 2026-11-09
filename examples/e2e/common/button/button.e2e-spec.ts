import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../../_test';
import { gotoDemo } from '../../_helpers';

// Story: CngxButton puts the button brain on a native button or anchor. The
// axes land as data-variant / data-tone / data-size, a disabled button stays
// focusable behind aria-disabled and a capture-phase guard, the reason is
// wired through aria-describedby only while it applies, and a co-hosted
// cngxAsyncClick drives aria-busy, data-pending (the whole run) and data-busy
// (the painted busy layer, after the show delay). The start and end slots
// follow the inline axis, so that pass runs once per direction.

const VARIANTS = 'common/button/button/variants';
const TONES = 'common/button/button/tones';
const SIZES = 'common/button/button/sizes';
const DISABLED = 'common/button/button/disabled-with-reason';
const ASYNC = 'common/button/button/async-click-busy';
const LINK = 'common/button/button/link-host';
const SLOTS = 'common/button/button/start-and-end-slots';
const SPINNER = 'common/button/button/custom-spinner';
const SCOPED = 'common/button/button/scoped-defaults';

async function setDirection(page: Page, dir: 'ltr' | 'rtl'): Promise<void> {
  await page.evaluate((d) => document.documentElement.setAttribute('dir', d), dir);
}

function artifactOf(page: Page): Locator {
  return page.locator('.cngx-ex-artifact');
}

/** Text of the node the host's aria-describedby points at, or null. */
async function describedText(page: Page, host: Locator): Promise<string | null> {
  const ids = await host.getAttribute('aria-describedby');
  if (!ids) {
    return null;
  }
  const texts = await Promise.all(
    ids.split(/\s+/).map((id) => page.locator(`[id="${id}"]`).textContent()),
  );
  return texts.map((t) => t?.trim() ?? '').join(' ');
}

type CountedHost = HTMLElement & { cngxE2eClicks?: number };

/**
 * Counts the clicks that reach a bubble listener on the host. The brain's
 * guard is a capture listener on the same element, so a swallowed click
 * never reaches this one.
 */
async function countClicks(host: Locator): Promise<void> {
  await host.evaluate((el: CountedHost) => {
    el.cngxE2eClicks = 0;
    el.addEventListener('click', () => {
      el.cngxE2eClicks = (el.cngxE2eClicks ?? 0) + 1;
    });
  });
}

function clicksOf(host: Locator): Promise<number> {
  return host.evaluate((el: CountedHost) => el.cngxE2eClicks ?? 0);
}

type LoggedHost = HTMLElement & { cngxE2eLog?: string[] };

/** Records every data-pending / data-busy change on the host, in order. */
async function recordRunAttributes(host: Locator): Promise<void> {
  await host.evaluate((el: LoggedHost) => {
    const log: string[] = [];
    el.cngxE2eLog = log;
    new MutationObserver((records) => {
      for (const record of records) {
        const name = record.attributeName ?? '';
        log.push(`${name}=${el.getAttribute(name) ?? 'null'}`);
      }
    }).observe(el, { attributes: true, attributeFilter: ['data-pending', 'data-busy'] });
  });
}

function runLogOf(host: Locator): Promise<string[]> {
  return host.evaluate((el: LoggedHost) => [...(el.cngxE2eLog ?? [])]);
}

test.describe('common/button/button', () => {
  test('variants: every variant lands as data-variant, solid is the default', async ({ page }) => {
    await gotoDemo(page, VARIANTS);
    const artifact = artifactOf(page);

    const variants = ['solid', 'secondary', 'outline', 'ghost', 'link'] as const;
    const buttons = artifact.getByRole('button');
    await expect(buttons).toHaveCount(10);
    for (let i = 0; i < variants.length; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('data-variant', variants[i]);
      await expect(buttons.nth(i)).toHaveAttribute('data-tone', 'neutral');
      await expect(buttons.nth(i + 5)).toHaveAttribute('data-variant', variants[i]);
      await expect(buttons.nth(i + 5)).toHaveAttribute('data-tone', 'primary');
    }
    // A native button host defaults to type="button", never an implicit submit.
    await expect(artifact.getByRole('button', { name: 'Solid' }).first()).toHaveAttribute(
      'type',
      'button',
    );
    await expect(artifact.getByRole('button', { name: 'Solid' }).first()).toHaveAttribute(
      'data-size',
      'md',
    );
  });

  test('tones: every tone and variant pair lands as data attributes', async ({ page }) => {
    await gotoDemo(page, TONES);
    const artifact = artifactOf(page);

    await expect(artifact.getByRole('button')).toHaveCount(15);
    for (const tone of ['neutral', 'primary', 'danger']) {
      for (const variant of ['solid', 'secondary', 'outline', 'ghost', 'link']) {
        const button = artifact.getByRole('button', { name: `${tone} ${variant}`, exact: true });
        await expect(button).toHaveAttribute('data-tone', tone);
        await expect(button).toHaveAttribute('data-variant', variant);
      }
    }
  });

  test('sizes: every size lands as data-size on both variants', async ({ page }) => {
    await gotoDemo(page, SIZES);
    const artifact = artifactOf(page);

    const sizes = [
      ['Extra small', 'xs'],
      ['Small', 'sm'],
      ['Medium', 'md'],
      ['Large', 'lg'],
    ] as const;
    for (const [name, size] of sizes) {
      const pair = artifact.getByRole('button', { name, exact: true });
      await expect(pair).toHaveCount(2);
      await expect(pair.nth(0)).toHaveAttribute('data-size', size);
      await expect(pair.nth(0)).toHaveAttribute('data-variant', 'solid');
      await expect(pair.nth(1)).toHaveAttribute('data-size', size);
      await expect(pair.nth(1)).toHaveAttribute('data-variant', 'outline');
    }
  });

  test('disabled-with-reason: focusable, refuses click/Enter/Space, describes why', async ({
    page,
  }) => {
    await gotoDemo(page, DISABLED);
    const publish = artifactOf(page).getByRole('button', { name: 'Publish' });
    const published = page.locator('.status-row');

    await expect(publish).toHaveAttribute('aria-disabled', 'true');
    // aria-disabled, never the native attribute: the button keeps its Tab stop.
    await expect(publish).not.toHaveAttribute('disabled');
    await publish.focus();
    await expect(publish).toBeFocused();
    await expect
      .poll(() => describedText(page, publish))
      .toBe('You need the editor role to publish.');

    await publish.click({ force: true });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(published).toHaveText('Published 0 time(s)');
    await expect(publish).toBeFocused();

    // Granted: the reason id leaves aria-describedby and activation works.
    await page.getByRole('button', { name: 'Grant editor role' }).click();
    await expect(publish).not.toHaveAttribute('aria-disabled');
    await expect(publish).not.toHaveAttribute('aria-describedby');
    await publish.click();
    await expect(published).toHaveText('Published 1 time(s)');
    await publish.focus();
    await page.keyboard.press('Enter');
    await expect(published).toHaveText('Published 2 time(s)');

    // Revoked again: the reason comes back.
    await page.getByRole('button', { name: 'Revoke editor role' }).click();
    await expect(publish).toHaveAttribute('aria-disabled', 'true');
    await expect
      .poll(() => describedText(page, publish))
      .toBe('You need the editor role to publish.');
  });

  test('async-click-busy: pending at activation, busy layer after the delay, settles', async ({
    page,
  }) => {
    await gotoDemo(page, ASYNC);
    await page.getByRole('radio', { name: /slow run/ }).check();
    const save = artifactOf(page).getByRole('button', { name: 'Save changes' });

    await expect(save).not.toHaveAttribute('aria-busy');
    await expect(save).not.toHaveAttribute('data-pending');
    await expect(save).not.toHaveAttribute('data-busy');
    await countClicks(save);
    await recordRunAttributes(save);

    await save.click();
    await expect(save).toHaveAttribute('data-pending', 'true');
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await expect(save).toHaveAttribute('data-busy', 'true');
    await expect(save.locator('.cngx-button__busy')).toHaveAttribute('aria-hidden', 'true');
    await expect(save.locator('.cngx-button__busy .cngx-button__spinner')).toHaveCount(1);
    // The run refuses further activation while it is pending.
    await expect(save).toHaveAttribute('aria-disabled', 'true');
    await save.click({ force: true });
    await save.click({ force: true });
    expect(await clicksOf(save)).toBe(1);

    await expect(save).not.toHaveAttribute('data-pending', { timeout: 5_000 });
    await expect(save).not.toHaveAttribute('data-busy', { timeout: 5_000 });
    await expect(save).not.toHaveAttribute('aria-busy', { timeout: 5_000 });
    await expect(save).not.toHaveAttribute('aria-disabled');
    await expect(save.locator('.cngx-button__busy')).toHaveCount(0);

    // data-pending is set first, data-busy follows once the show delay passed.
    const log = await runLogOf(save);
    expect(log[0]).toBe('data-pending=true');
    expect(log.indexOf('data-busy=true')).toBeGreaterThan(0);

    // Settled: the button activates again.
    await save.click();
    expect(await clicksOf(save)).toBe(2);
    await expect(save).toHaveAttribute('data-pending', 'true');
  });

  test('async-click-busy: a run shorter than the show delay never paints busy', async ({
    page,
  }) => {
    await gotoDemo(page, ASYNC);
    await page.getByRole('radio', { name: /fast run/ }).check();
    const save = artifactOf(page).getByRole('button', { name: 'Save changes' });
    await recordRunAttributes(save);

    await save.click();
    await expect.poll(() => runLogOf(save)).toEqual(['data-pending=true', 'data-pending=null']);
    await expect(save).not.toHaveAttribute('aria-busy');
    await expect(save).not.toHaveAttribute('data-busy');
  });

  test('link-host: stays a link, activates on Enter, swallows clicks while pending', async ({
    page,
  }) => {
    await gotoDemo(page, LINK);
    const artifact = artifactOf(page);
    const guide = artifact.getByRole('link', { name: 'Installation guide' });
    const clicks = page
      .locator('.event-row')
      .filter({ has: page.getByText('(click) listener fired', { exact: true }) })
      .locator('.event-value');

    await expect(guide).toHaveAttribute('data-variant', 'solid');
    await expect(guide).toHaveAttribute('data-tone', 'primary');
    // No type on an anchor host, and no role override.
    await expect(guide).not.toHaveAttribute('type');
    await expect(guide).not.toHaveAttribute('role');
    await expect(artifact.getByRole('link', { name: 'Angular installation docs' })).toHaveAttribute(
      'data-variant',
      'link',
    );

    await guide.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/visit=1/);
    await expect(clicks).toHaveText('1 time(s)');
    await expect(guide).toHaveAttribute('data-pending', 'true');
    await expect(guide).toHaveAttribute('aria-busy', 'true');

    // While the prefetch runs, neither the router nor the (click) listener acts.
    await guide.click({ force: true });
    await page.keyboard.press('Enter');
    await expect(clicks).toHaveText('1 time(s)');
    await expect(page).not.toHaveURL(/visit=2/);

    await expect(guide).not.toHaveAttribute('data-pending', { timeout: 5_000 });
    await expect(guide).not.toHaveAttribute('aria-busy', { timeout: 5_000 });
    await guide.click();
    await expect(page).toHaveURL(/visit=2/);
    await expect(clicks).toHaveText('2 time(s)');
  });

  test('link-host: offline link is aria-disabled with its reason and does not navigate', async ({
    page,
  }) => {
    await gotoDemo(page, LINK);
    const guide = artifactOf(page).getByRole('link', { name: 'Installation guide' });
    const url = page.url();

    await expect(guide).not.toHaveAttribute('aria-describedby');
    await page.getByRole('checkbox', { name: /Offline/ }).check();
    await expect(guide).toHaveAttribute('aria-disabled', 'true');
    await expect
      .poll(() => describedText(page, guide))
      .toBe('The guide is offline for maintenance.');

    await guide.focus();
    await expect(guide).toBeFocused();
    await page.keyboard.press('Enter');
    await guide.click({ force: true });
    expect(page.url()).toBe(url);
    await expect(
      page
        .locator('.event-row')
        .filter({ has: page.getByText('(click) listener fired', { exact: true }) })
        .locator('.event-value'),
    ).toHaveText('0 time(s)');
  });

  test('custom-spinner: the provided spinner renders inside the busy layer', async ({ page }) => {
    await gotoDemo(page, SPINNER);
    const artifact = artifactOf(page);
    const save = artifact.getByRole('button', { name: 'Save changes' });
    const sync = artifact.getByRole('button', { name: 'Sync' });

    await save.click();
    await expect(save).toHaveAttribute('data-busy', 'true');
    const layer = save.locator('.cngx-button__busy');
    await expect(layer).toHaveAttribute('aria-hidden', 'true');
    await expect(layer.locator('demo-dots-spinner .demo-dots-spinner__dot')).toHaveCount(3);
    await expect(layer.locator('.cngx-button__spinner')).toHaveCount(0);
    // The spinner stays out of the name.
    await expect(artifact.getByRole('button', { name: 'Save changes', exact: true })).toBeVisible();

    await sync.click();
    await expect(sync).toHaveAttribute('data-busy', 'true');
    await expect(sync.locator('.cngx-button__busy demo-dots-spinner')).toHaveCount(1);

    await expect(save).not.toHaveAttribute('data-busy', { timeout: 5_000 });
    await expect(sync).not.toHaveAttribute('data-busy', { timeout: 5_000 });
    await expect(artifact.locator('demo-dots-spinner')).toHaveCount(0);
  });

  test('scoped-defaults: provideCngxButtonAt sets variant, size, spinner, close icon', async ({
    page,
  }) => {
    await gotoDemo(page, SCOPED);
    const artifact = artifactOf(page);
    const cancel = artifact.getByRole('button', { name: 'Cancel' });
    const draft = artifact.getByRole('button', { name: 'Save draft' });
    const publish = artifact.getByRole('button', { name: 'Publish' });
    const close = artifact.getByRole('button', { name: 'Close editor' });

    await expect(cancel).toHaveAttribute('data-variant', 'outline');
    await expect(cancel).toHaveAttribute('data-size', 'sm');
    await expect(draft).toHaveAttribute('data-variant', 'outline');
    await expect(draft).toHaveAttribute('data-tone', 'primary');
    // An explicit variant wins over the scoped default.
    await expect(publish).toHaveAttribute('data-variant', 'solid');
    await expect(publish).toHaveAttribute('data-size', 'sm');
    // The close button keeps its fixed axes and takes the scoped glyph.
    await expect(close).toHaveAttribute('data-variant', 'ghost');
    await expect(close.locator('.cngx-icon-button__glyph demo-circle-close')).toHaveCount(1);

    await draft.click();
    await expect(draft).toHaveAttribute('data-busy', 'true');
    await expect(draft.locator('.cngx-button__busy demo-dots-spinner')).toHaveCount(1);
    await expect(draft).not.toHaveAttribute('data-busy', { timeout: 5_000 });
  });
});

for (const dir of ['ltr', 'rtl'] as const) {
  test.describe(`common/button/button slots (${dir})`, () => {
    test('start-and-end-slots: slots render on either side of the label', async ({ page }) => {
      await gotoDemo(page, SLOTS);
      await setDirection(page, dir);
      const artifact = artifactOf(page);

      const newItem = artifact.getByRole('button', { name: 'New item' });
      const exportBtn = artifact.getByRole('button', { name: 'Export' });
      const search = artifact.getByRole('button', { name: /^Search/ });
      await expect(newItem).toHaveAttribute('data-start', '');
      await expect(newItem).not.toHaveAttribute('data-end');
      await expect(exportBtn).toHaveAttribute('data-end', '');
      await expect(exportBtn).not.toHaveAttribute('data-start');
      await expect(search).toHaveAttribute('data-end', '');
      await expect(artifact.getByRole('button', { name: 'Inbox, 4 unread' })).toBeVisible();

      // The label sits between the slots; the slots follow the inline axis.
      const startBox = await newItem.locator('[cngxbuttonstart]').boundingBox();
      const labelBox = await newItem.locator('.cngx-button__label').boundingBox();
      const endBox = await exportBtn.locator('[cngxbuttonend]').boundingBox();
      const exportLabel = await exportBtn.locator('.cngx-button__label').boundingBox();
      expect(startBox && labelBox && endBox && exportLabel).toBeTruthy();
      await expect(newItem.locator('.cngx-button__label')).toHaveText('New item');
      await expect(exportBtn.locator('.cngx-button__label')).toHaveText('Export');
      if (dir === 'ltr') {
        expect(startBox!.x).toBeLessThan(labelBox!.x);
        expect(endBox!.x).toBeGreaterThan(exportLabel!.x);
      } else {
        expect(startBox!.x).toBeGreaterThan(labelBox!.x);
        expect(endBox!.x).toBeLessThan(exportLabel!.x);
      }
    });
  });
}
