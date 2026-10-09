import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
});
