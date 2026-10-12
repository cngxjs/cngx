import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAnnouncementRecorder as createPublicAnnouncementRecorder } from '@cngx/core/utils';

import { createAnnouncementRecorder, type CngxAnnouncementRecorder } from './announcement-recorder';

const observed = () => Promise.resolve();

function region(attrs: Record<string, string>, text = ''): HTMLElement {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
  el.textContent = text;
  return el;
}

describe('createAnnouncementRecorder', () => {
  let host: HTMLElement;
  let recorder: CngxAnnouncementRecorder;

  beforeEach(() => {
    host = document.createElement('section');
    document.body.appendChild(host);
  });

  afterEach(() => {
    recorder?.destroy();
    host.remove();
    vi.unstubAllGlobals();
  });

  function start(options: Parameters<typeof createAnnouncementRecorder>[0] = {}) {
    recorder = createAnnouncementRecorder({ root: host, owner: () => null, ...options });
    return recorder;
  }

  const texts = () => recorder.entries().map((entry) => entry.text);

  it('records polite and assertive writes as mutations', async () => {
    const polite = region({ 'aria-live': 'polite' });
    const assertive = region({ 'aria-live': 'assertive' });
    host.append(polite, assertive);
    start();

    polite.textContent = 'Saved';
    assertive.textContent = 'Failed';
    await observed();

    expect(recorder.entries()).toEqual([
      expect.objectContaining({
        text: 'Saved',
        politeness: 'polite',
        origin: 'mutation',
        role: null,
        busy: false,
        suppressedBy: null,
        region: polite,
        owner: null,
      }),
      expect.objectContaining({ text: 'Failed', politeness: 'assertive', origin: 'mutation' }),
    ]);
  });

  it('does not record text present at start', async () => {
    host.append(region({ role: 'status' }, 'Ready'));
    start();
    await observed();

    expect(recorder.entries()).toEqual([]);
  });

  it('records role=alert and role=status regions inserted with text as insertions', async () => {
    start();

    host.append(region({ role: 'alert' }, 'Disk full'), region({ role: 'status' }, 'Synced'));
    await observed();

    expect(recorder.entries()).toEqual([
      expect.objectContaining({
        text: 'Disk full',
        role: 'alert',
        politeness: 'assertive',
        origin: 'insertion',
      }),
      expect.objectContaining({
        text: 'Synced',
        role: 'status',
        politeness: 'polite',
        origin: 'insertion',
      }),
    ]);
  });

  it('records an inserted region with an ancestor wrapper as an insertion', async () => {
    start();
    const wrapper = document.createElement('div');
    wrapper.append(region({ 'aria-live': 'polite' }, 'Nested'));

    host.append(wrapper);
    await observed();

    expect(recorder.entries()).toEqual([
      expect.objectContaining({ text: 'Nested', origin: 'insertion' }),
    ]);
  });

  it('records an element with text that gains role=status later as became-live', async () => {
    const el = region({}, 'Uploaded');
    host.append(el);
    start();

    el.setAttribute('role', 'status');
    await observed();

    expect(recorder.entries()).toEqual([
      expect.objectContaining({ text: 'Uploaded', role: 'status', origin: 'became-live' }),
    ]);
  });

  it('records nothing for an inserted empty region until text arrives', async () => {
    start();
    const el = region({ role: 'status' });

    host.append(el);
    await observed();
    expect(recorder.entries()).toEqual([]);

    el.textContent = 'Loaded';
    await observed();
    expect(recorder.entries()).toEqual([
      expect.objectContaining({ text: 'Loaded', origin: 'mutation' }),
    ]);
  });

  describe('writes sharing a batch with the region appearing', () => {
    it('records an append after an empty insertion as a mutation', async () => {
      start();
      const el = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });

      host.append(el);
      el.textContent = 'Copied';
      await observed();

      expect(recorder.entries()).toEqual([
        expect.objectContaining({ text: 'Copied', origin: 'mutation' }),
      ]);
    });

    it('records an insertion with text and a later append as two entries', async () => {
      start();
      const log = region({ role: 'log' }, 'First');

      host.append(log);
      const line = document.createElement('p');
      line.textContent = 'Second';
      log.append(line);
      await observed();

      expect(recorder.entries().map((entry) => [entry.text, entry.origin])).toEqual([
        ['First', 'insertion'],
        ['Second', 'mutation'],
      ]);
    });

    it('records a region rewritten after its insertion once, as an insertion', async () => {
      start();
      const el = region({ role: 'status' }, 'Draft');

      host.append(el);
      el.textContent = 'Final';
      await observed();

      expect(recorder.entries()).toEqual([
        expect.objectContaining({ text: 'Final', origin: 'insertion' }),
      ]);
    });

    it('records text written before an element became live as part of became-live', async () => {
      const el = document.createElement('div');
      host.append(el);
      start();

      el.textContent = 'Ready';
      el.setAttribute('role', 'status');
      await observed();

      expect(recorder.entries()).toEqual([
        expect.objectContaining({ text: 'Ready', origin: 'became-live' }),
      ]);
    });
  });

  it('counts an identical write after a clear as a new entry', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start();

    el.textContent = 'Copied';
    await observed();
    el.textContent = '';
    await observed();
    el.textContent = 'Copied';
    await observed();

    expect(texts()).toEqual(['Copied', 'Copied']);
  });

  it('records an identical write without a clear once', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start();

    el.textContent = 'Copied';
    await observed();
    el.textContent = 'Copied';
    await observed();

    expect(texts()).toEqual(['Copied']);
  });

  it('records only the added text of a non-atomic region', async () => {
    const log = region({ role: 'log' });
    log.innerHTML = '<p>First line</p>';
    host.append(log);
    start();

    const line = document.createElement('p');
    line.textContent = 'Second line';
    log.append(line);
    await observed();

    expect(texts()).toEqual(['Second line']);
  });

  it('records the whole text of an atomic region', async () => {
    const el = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });
    el.innerHTML = '<span>3 results</span>';
    host.append(el);
    start();

    const extra = document.createElement('span');
    extra.textContent = ' for "cat"';
    el.append(extra);
    await observed();

    expect(texts()).toEqual(['3 results for "cat"']);
  });

  describe('text separation', () => {
    async function recordAtomic(html: string): Promise<string[]> {
      const el = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });
      host.append(el);
      start();

      el.innerHTML = html;
      await observed();
      return texts();
    }

    it('separates adjacent block children', async () => {
      expect(await recordAtomic('<div>Upload failed</div><div>Alert dismissed</div>')).toEqual([
        'Upload failed Alert dismissed',
      ]);
    });

    it.each([
      ['<strong>3</strong> results', '3 results'],
      ['un<em>believ</em>able', 'unbelievable'],
    ])('leaves inline text %s unchanged', async (html, expected) => {
      expect(await recordAtomic(html)).toEqual([expected]);
    });

    it('separates text around a br', async () => {
      expect(await recordAtomic('A<br>B')).toEqual(['A B']);
    });

    it('separates adjacent custom elements', async () => {
      expect(await recordAtomic('<cngx-a>Inbox</cngx-a><cngx-b>Sent</cngx-b>')).toEqual([
        'Inbox Sent',
      ]);
    });

    it('separates adjacent options', async () => {
      const el = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });
      host.append(el);
      start();

      const options = ['Red', 'Green'].map((label) => {
        const option = document.createElement('option');
        option.textContent = label;
        return option;
      });
      el.append(...options);
      await observed();

      expect(texts()).toEqual(['Red Green']);
    });

    it('does not separate a non-HTML element whose name contains a dash', async () => {
      const el = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });
      host.append(el);
      start();

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const fontFace = document.createElementNS('http://www.w3.org/2000/svg', 'font-face');
      fontFace.textContent = 'believ';
      svg.append('un', fontFace, 'able');
      el.append(svg);
      await observed();

      expect(texts()).toEqual(['unbelievable']);
    });

    it('separates block children in an XHTML document with lowercase tag names', async () => {
      const xhtml = 'http://www.w3.org/1999/xhtml';
      const doc = document.implementation.createDocument(xhtml, 'html');
      const body = doc.createElementNS(xhtml, 'body');
      doc.documentElement.append(body);
      const el = doc.createElementNS(xhtml, 'div');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      body.append(el);
      recorder = createAnnouncementRecorder({ root: body, owner: () => null });

      for (const label of ['Upload failed', 'Alert dismissed']) {
        const block = doc.createElementNS(xhtml, 'div');
        block.textContent = label;
        el.append(block);
      }
      await observed();

      expect(el.tagName).toBe('div');
      expect(texts()).toEqual(['Upload failed Alert dismissed']);
    });

    it('collapses already-spaced block text to one space', async () => {
      expect(await recordAtomic('<p>A </p><p> B</p>')).toEqual(['A B']);
    });

    it('separates a block child from its sibling text in the added text of a non-atomic region', async () => {
      const log = region({ role: 'log' });
      host.append(log);
      start();

      const line = document.createElement('span');
      line.innerHTML = 'Retry<div>3 left</div>';
      log.append(line);
      await observed();

      expect(texts()).toEqual(['Retry 3 left']);
    });
  });

  it('records nothing when content is only removed', async () => {
    const el = region({ role: 'status' });
    el.innerHTML = '<span>A</span><span>B</span>';
    host.append(el);
    start();

    el.lastElementChild?.remove();
    await observed();

    expect(recorder.entries()).toEqual([]);
  });

  it('leaves out text inside aria-hidden and hidden descendants', async () => {
    const el = region({ role: 'status' });
    host.append(el);
    start();

    el.innerHTML = '<span aria-hidden="true">x</span><span hidden>old</span> Saved';
    await observed();

    expect(texts()).toEqual(['Saved']);
  });

  it('leaves a write inside an aria-hidden descendant out of the added text', async () => {
    const log = region({ role: 'log' });
    log.innerHTML = '<span aria-hidden="true">idle</span>';
    host.append(log);
    start();

    const line = document.createElement('p');
    line.textContent = 'Row';
    log.append(line);
    (log.firstElementChild?.firstChild as Text).data = 'spin';
    const glyph = document.createElement('b');
    glyph.textContent = '*';
    log.firstElementChild?.append(glyph);
    await observed();

    expect(texts()).toEqual(['Row']);
  });

  it('records characterData changes on an existing text node', async () => {
    const el = region({ 'aria-live': 'polite' }, 'Page 1');
    host.append(el);
    start();

    (el.firstChild as Text).data = 'Page 2';
    await observed();

    expect(texts()).toEqual(['Page 2']);
  });

  it('attributes a write to the innermost region', async () => {
    const outer = region({ role: 'alert' });
    const inner = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });
    outer.append(inner);
    host.append(outer);
    start();

    inner.textContent = 'Dismissed';
    await observed();

    expect(recorder.entries()).toEqual([
      expect.objectContaining({ text: 'Dismissed', region: inner, politeness: 'polite' }),
    ]);
  });

  it('drops the oldest entries beyond limit', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start({ limit: 2 });

    for (const text of ['one', 'two', 'three']) {
      el.textContent = text;
      await observed();
    }

    expect(texts()).toEqual(['two', 'three']);
  });

  it('clear() empties the log and recording continues', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start();

    el.textContent = 'one';
    await observed();
    recorder.clear();
    el.textContent = 'two';
    await observed();

    expect(texts()).toEqual(['two']);
  });

  it('stops recording after destroy(), including writes still pending', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start();

    el.textContent = 'pending';
    recorder.destroy();
    await observed();
    el.textContent = 'after';
    await observed();

    expect(recorder.entries()).toEqual([]);
  });

  it('starts recording when aria-live flips from off to polite and stops on the reverse', async () => {
    const el = region({ 'aria-live': 'off' });
    host.append(el);
    start();

    el.textContent = 'ignored';
    await observed();
    expect(recorder.entries()).toEqual([]);

    el.setAttribute('aria-live', 'polite');
    await observed();
    el.textContent = 'heard';
    await observed();
    el.setAttribute('aria-live', 'off');
    await observed();
    el.textContent = 'ignored again';
    await observed();

    expect(recorder.entries()).toEqual([
      expect.objectContaining({ text: 'ignored', origin: 'became-live' }),
      expect.objectContaining({ text: 'heard', origin: 'mutation' }),
    ]);
  });

  it('stops recording when the role is removed', async () => {
    const el = region({ role: 'status' });
    host.append(el);
    start();

    el.removeAttribute('role');
    await observed();
    el.textContent = 'silent';
    await observed();

    expect(recorder.entries()).toEqual([]);
  });

  it('treats aria-live="off" as overriding an implicit role politeness', async () => {
    const el = region({ role: 'status', 'aria-live': 'off' });
    host.append(el);
    start();

    el.textContent = 'silent';
    await observed();

    expect(recorder.entries()).toEqual([]);
  });

  it('shows a politeness flip on the next entry', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start();

    el.textContent = 'first';
    await observed();
    el.setAttribute('aria-live', 'assertive');
    el.textContent = 'second';
    await observed();

    expect(recorder.entries().map((entry) => entry.politeness)).toEqual(['polite', 'assertive']);
  });

  it('records busy while an ancestor carries aria-busy="true"', async () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('aria-busy', 'true');
    const el = region({ 'aria-live': 'polite' });
    wrapper.append(el);
    host.append(wrapper);
    start();

    el.textContent = 'Loading';
    await observed();
    wrapper.removeAttribute('aria-busy');
    el.textContent = 'Loaded';
    await observed();

    expect(recorder.entries().map((entry) => entry.busy)).toEqual([true, false]);
  });

  describe('busy flip', () => {
    function busyWrapper(...children: Element[]): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('aria-busy', 'true');
      wrapper.append(...children);
      host.append(wrapper);
      return wrapper;
    }

    const summaries = () =>
      recorder.entries().map(({ text, origin, busy }) => ({ text, origin, busy }));

    it('records the deferred text as busy-cleared once aria-busy is removed', async () => {
      const el = region({ 'aria-live': 'polite' });
      const wrapper = busyWrapper(el);
      start();

      el.textContent = 'Loaded';
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([
        { text: 'Loaded', origin: 'mutation', busy: true },
        { text: 'Loaded', origin: 'busy-cleared', busy: false },
      ]);
    });

    it('records only the appends made while busy for a log, not its earlier history', async () => {
      const log = region({ role: 'log' });
      host.append(log);
      start();

      const appendLine = (text: string) => {
        const line = document.createElement('p');
        line.textContent = text;
        log.append(line);
      };
      appendLine('Earlier');
      await observed();
      log.setAttribute('aria-busy', 'true');
      appendLine('Second');
      await observed();
      appendLine('Third');
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([
        { text: 'Earlier', origin: 'mutation', busy: false },
        { text: 'Second', origin: 'mutation', busy: true },
        { text: 'Third', origin: 'mutation', busy: true },
        { text: 'Second Third', origin: 'busy-cleared', busy: false },
      ]);
    });

    it('records the whole current text of an atomic status region', async () => {
      const el = region({ role: 'status', 'aria-busy': 'true' });
      host.append(el);
      start();

      el.textContent = 'Saving';
      await observed();
      el.innerHTML = '<span>Saved</span> <span>3 items</span>';
      await observed();
      el.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'Saved 3 items',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('records nothing when the region is empty at the flip', async () => {
      const el = region({ role: 'status', 'aria-busy': 'true' });
      host.append(el);
      start();

      el.textContent = 'Saving';
      await observed();
      el.textContent = '';
      await observed();
      el.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Saving', origin: 'mutation', busy: true }]);
    });

    it('treats aria-busy="false" like removal', async () => {
      const el = region({ 'aria-live': 'polite' });
      const wrapper = busyWrapper(el);
      start();

      el.textContent = 'Loaded';
      await observed();
      wrapper.setAttribute('aria-busy', 'false');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'Loaded',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('records every region below an ancestor flip that has a deferred write', async () => {
      const first = region({ 'aria-live': 'polite' });
      const second = region({ role: 'status' });
      const wrapper = busyWrapper(first, second);
      start();

      first.textContent = 'Rows loaded';
      second.textContent = '12 results';
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries().filter((entry) => entry.origin === 'busy-cleared')).toEqual([
        { text: 'Rows loaded', origin: 'busy-cleared', busy: false },
        { text: '12 results', origin: 'busy-cleared', busy: false },
      ]);
    });

    it('records nothing on a flip with no deferred write before it', async () => {
      const el = region({ 'aria-live': 'polite' });
      host.append(el);
      start();

      el.textContent = 'Ready';
      await observed();
      el.setAttribute('aria-busy', 'true');
      await observed();
      el.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Ready', origin: 'mutation', busy: false }]);
    });

    it('records one non-busy mutation when the write and the flip share a batch', async () => {
      const el = region({ 'aria-live': 'polite' });
      const wrapper = busyWrapper(el);
      start();

      el.textContent = 'Loaded';
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Loaded', origin: 'mutation', busy: false }]);
    });

    it('keeps text deferred in an earlier batch when a write shares the batch with the flip', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start();

      const appendLine = (text: string) => {
        const line = document.createElement('p');
        line.textContent = text;
        log.append(line);
      };
      appendLine('First');
      await observed();
      appendLine('Second');
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([
        { text: 'First', origin: 'mutation', busy: true },
        { text: 'First Second', origin: 'busy-cleared', busy: false },
      ]);
    });

    it('records nothing for a non-atomic region emptied while busy', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start();

      log.textContent = 'Draft';
      await observed();
      log.textContent = '';
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Draft', origin: 'mutation', busy: true }]);
    });

    it('records only the text a non-atomic region still holds when overwritten while busy', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start();

      log.textContent = 'Draft';
      await observed();
      log.textContent = 'Final';
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({ text: 'Final', origin: 'busy-cleared', busy: false });
    });

    it('reads a deferred node and a later write inside it once', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start();

      const line = document.createElement('p');
      line.textContent = 'Upload';
      log.append(line);
      await observed();
      line.append(' done');
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'Upload done',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('records nothing for a region removed in the batch that clears busy', async () => {
      const el = region({ 'aria-live': 'polite' });
      const wrapper = busyWrapper(el);
      start();

      el.textContent = 'Loaded';
      await observed();
      wrapper.removeAttribute('aria-busy');
      wrapper.remove();
      await observed();

      expect(summaries()).toEqual([{ text: 'Loaded', origin: 'mutation', busy: true }]);
    });

    it('keeps at most limit deferred writes for a region that stays busy', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start({ limit: 2 });

      for (const text of ['one', 'two', 'three']) {
        const line = document.createElement('p');
        line.textContent = text;
        log.append(line);
        await observed();
      }
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'two three',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('still records a write deferred before clear() on the flip after it', async () => {
      const el = region({ 'aria-live': 'polite' });
      const wrapper = busyWrapper(el);
      start();

      el.textContent = 'Loaded';
      await observed();
      recorder.clear();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Loaded', origin: 'busy-cleared', busy: false }]);
    });

    it('keeps a region inserted under busy an insertion, with no busy-cleared entry', async () => {
      const wrapper = busyWrapper();
      start();

      wrapper.append(region({ role: 'status' }, 'Ready'));
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Ready', origin: 'insertion', busy: true }]);
    });

    it('replays an alert inserted under busy when busy clears', async () => {
      const wrapper = busyWrapper();
      start();

      wrapper.append(region({ role: 'alert' }, 'Disk full'));
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(
        recorder.entries().map(({ text, origin, busy, role }) => ({ text, origin, busy, role })),
      ).toEqual([
        { text: 'Disk full', origin: 'insertion', busy: true, role: 'alert' },
        { text: 'Disk full', origin: 'busy-cleared', busy: false, role: 'alert' },
      ]);
    });

    it('reads a non-atomic alert that appeared under busy once, with its later writes', async () => {
      const wrapper = busyWrapper();
      start();

      const alert = region({ role: 'alert', 'aria-atomic': 'false' }, 'Error');
      wrapper.append(alert);
      await observed();
      const retry = document.createElement('p');
      retry.textContent = 'Retry';
      alert.append(retry);
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'Error Retry',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('replays the current text of an alert that became live under busy', async () => {
      const el = region({}, 'Upload failed');
      const wrapper = busyWrapper(el);
      start();

      el.setAttribute('role', 'alert');
      await observed();
      el.textContent = 'Upload failed, retry';
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'Upload failed, retry',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('keeps a region that became live under busy out of the flip', async () => {
      const el = region({}, 'Uploaded');
      const wrapper = busyWrapper(el);
      start();

      el.setAttribute('role', 'status');
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Uploaded', origin: 'became-live', busy: true }]);
    });

    it('keeps the busy writes of a log moved while busy, without its history', async () => {
      const log = region({ role: 'log' });
      const wrapper = busyWrapper();
      const other = document.createElement('div');
      wrapper.append(log, other);
      start();

      const appendLine = (text: string) => {
        const line = document.createElement('p');
        line.textContent = text;
        log.append(line);
      };
      wrapper.removeAttribute('aria-busy');
      appendLine('A');
      await observed();
      appendLine('B');
      await observed();
      wrapper.setAttribute('aria-busy', 'true');
      appendLine('C');
      await observed();
      other.append(log);
      await observed();
      wrapper.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({ text: 'C', origin: 'busy-cleared', busy: false });
    });

    it('reads the busy writes of a log moved out of the busy subtree', async () => {
      const log = region({ role: 'log' });
      const wrapper = busyWrapper(log);
      start();

      const line = document.createElement('p');
      line.textContent = 'Saved';
      log.append(line);
      await observed();
      host.append(log);
      await observed();

      expect(summaries()).toEqual([
        { text: 'Saved', origin: 'mutation', busy: true },
        { text: 'Saved', origin: 'insertion', busy: false },
        { text: 'Saved', origin: 'busy-cleared', busy: false },
      ]);
      expect(wrapper.contains(log)).toBe(false);
    });

    it('records nothing for a region that stops being live while deferred', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start();

      log.textContent = 'Draft';
      await observed();
      log.removeAttribute('role');
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([{ text: 'Draft', origin: 'mutation', busy: true }]);
    });

    it('leaves a hidden glyph written in a busy batch out of both entries', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      log.innerHTML = '<span aria-hidden="true">idle</span>';
      host.append(log);
      start();

      const line = document.createElement('p');
      line.textContent = 'Row';
      log.append(line);
      (log.firstElementChild?.firstChild as Text).data = 'spin';
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries()).toEqual([
        { text: 'Row', origin: 'mutation', busy: true },
        { text: 'Row', origin: 'busy-cleared', busy: false },
      ]);
    });

    it('reads a text node rewritten while busy at its current value on the flip', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      const text = document.createTextNode('');
      log.append(text);
      host.append(log);
      start();

      text.data = '1 of 3';
      await observed();
      text.data = '3 of 3';
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({ text: '3 of 3', origin: 'busy-cleared', busy: false });
    });

    it('does not let a removed busy write push present text out of the bound', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start({ limit: 2 });

      const appendLine = (text: string) => {
        const line = document.createElement('p');
        line.textContent = text;
        log.append(line);
        return line;
      };
      appendLine('First');
      await observed();
      const draft = appendLine('Draft');
      await observed();
      draft.remove();
      appendLine('Final');
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: 'First Final',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('evicts the least recently written node first, counting a rewrite as a write', async () => {
      const log = region({ role: 'log', 'aria-busy': 'true' });
      host.append(log);
      start({ limit: 2 });

      const counter = document.createTextNode('1 of 3');
      log.append(counter);
      await observed();
      const line = document.createElement('p');
      line.textContent = 'Uploading';
      log.append(line);
      await observed();
      counter.data = '2 of 3';
      await observed();
      const done = document.createElement('p');
      done.textContent = 'Done';
      log.append(done);
      await observed();
      log.removeAttribute('aria-busy');
      await observed();

      expect(summaries().at(-1)).toEqual({
        text: '2 of 3 Done',
        origin: 'busy-cleared',
        busy: false,
      });
    });

    it('records nothing for an unrelated attribute change while still busy', async () => {
      const el = region({ 'aria-live': 'polite' });
      const wrapper = busyWrapper(el);
      start();

      el.textContent = 'Loading';
      await observed();
      wrapper.setAttribute('aria-hidden', 'false');
      await observed();

      expect(summaries()).toEqual([{ text: 'Loading', origin: 'mutation', busy: true }]);
    });
  });

  describe('suppressedBy', () => {
    it.each([
      ['hidden', 'hidden', ''],
      ['aria-hidden', 'aria-hidden', 'true'],
      ['inert', 'inert', ''],
    ] as const)('records %s on an ancestor', async (reason, attribute, value) => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute(attribute, value);
      const el = region({ 'aria-live': 'polite' });
      wrapper.append(el);
      host.append(wrapper);
      start();

      el.textContent = 'Muted';
      await observed();

      expect(recorder.entries()).toEqual([
        expect.objectContaining({ text: 'Muted', suppressedBy: reason }),
      ]);
    });

    it('records hidden on the region itself before aria-hidden', async () => {
      const el = region({ 'aria-live': 'polite', hidden: '', 'aria-hidden': 'true' });
      host.append(el);
      start();

      el.textContent = 'Muted';
      await observed();

      expect(recorder.entries()[0].suppressedBy).toBe('hidden');
    });

    it('records aria-modal outside an open modal, not inside it, and null once it closes', async () => {
      const outside = region({ 'aria-live': 'polite' });
      const modal = document.createElement('dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('open', '');
      const inside = region({ 'aria-live': 'polite' });
      modal.append(inside);
      host.append(outside, modal);
      start();

      outside.textContent = 'Behind';
      inside.textContent = 'In front';
      await observed();
      modal.removeAttribute('open');
      outside.textContent = 'Back again';
      await observed();

      expect(recorder.entries().map((entry) => [entry.text, entry.suppressedBy])).toEqual([
        ['Behind', 'aria-modal'],
        ['In front', null],
        ['Back again', null],
      ]);
    });

    it('ignores an aria-modal element that is itself hidden', async () => {
      const outside = region({ 'aria-live': 'polite' });
      const modal = document.createElement('div');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('hidden', '');
      host.append(outside, modal);
      start();

      outside.textContent = 'Heard';
      await observed();

      expect(recorder.entries()[0].suppressedBy).toBeNull();
    });
  });

  describe('write orders', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('records write-then-clear-on-rAF twice for two identical writes', async () => {
      const el = region({ 'aria-live': 'polite' });
      host.append(el);
      start();

      for (let i = 0; i < 2; i++) {
        el.textContent = 'Dialog opened';
        await observed();
        requestAnimationFrame(() => {
          el.textContent = '';
        });
        vi.advanceTimersByTime(16);
        await observed();
      }

      expect(texts()).toEqual(['Dialog opened', 'Dialog opened']);
    });

    it('records clear-then-write-after-16-ms twice for two identical writes', async () => {
      const el = region({ 'aria-live': 'polite', 'aria-atomic': 'true' });
      host.append(el);
      start();

      for (let i = 0; i < 2; i++) {
        el.textContent = '';
        setTimeout(() => {
          el.textContent = 'Copied';
        }, 16);
        await observed();
        expect(texts()).toHaveLength(i);
        vi.advanceTimersByTime(16);
        await observed();
      }

      expect(texts()).toEqual(['Copied', 'Copied']);
    });
  });

  it('carries the cngx-dev marker on the returned object', () => {
    start();

    expect(Object.prototype.toString.call(recorder)).toBe('[object cngx-dev:recorder]');
  });

  it('resolves owner through the given function', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    start({ owner: (r) => (r === el ? 'Owner' : null) });

    el.textContent = 'Hi';
    await observed();

    expect(recorder.entries()[0].owner).toBe('Owner');
  });

  it('defaults owner to null when no Angular debug global is present', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    recorder = createAnnouncementRecorder({ root: host });
    vi.stubGlobal('ng', undefined);

    el.textContent = 'Hi';
    await observed();

    expect(recorder.entries()[0].owner).toBeNull();
  });

  it('defaults owner to the owning component class name', async () => {
    class OwningThing {}
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    vi.stubGlobal('ng', { getOwningComponent: () => new OwningThing() });
    recorder = createAnnouncementRecorder({ root: host });

    el.textContent = 'Hi';
    await observed();

    expect(recorder.entries()[0].owner).toBe('OwningThing');
  });

  it('observes the document by default', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    recorder = createAnnouncementRecorder({ owner: () => null });

    el.textContent = 'From the document';
    await observed();

    expect(texts()).toEqual(['From the document']);
  });

  it('is public API of @cngx/core/utils', async () => {
    const el = region({ 'aria-live': 'polite' });
    host.append(el);
    recorder = createPublicAnnouncementRecorder({ root: host, owner: () => null });

    el.textContent = 'Public';
    await observed();

    expect(createPublicAnnouncementRecorder).toBe(createAnnouncementRecorder);
    expect(texts()).toEqual(['Public']);
  });
});
