import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAnnouncementCapture, type CngxAnnouncementCapture } from './public-api';

const observed = () => Promise.resolve();

function region(attrs: Record<string, string>, text = ''): HTMLElement {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, value);
  }
  el.textContent = text;
  return el;
}

describe('createAnnouncementCapture', () => {
  let host: HTMLElement;
  let capture: CngxAnnouncementCapture;

  beforeEach(() => {
    host = document.createElement('section');
    document.body.appendChild(host);
  });

  afterEach(() => {
    capture?.stop();
    host.remove();
  });

  function start(): void {
    capture = createAnnouncementCapture({ root: host });
  }

  it('hears a text change in a polite region', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    start();

    polite.textContent = 'Saved';
    await observed();

    expect(capture.heard()).toEqual(['Saved']);
    expect(capture.entries().map((entry) => entry.origin)).toEqual(['mutation']);
  });

  it('hears a role="alert" inserted with its text', async () => {
    start();

    host.append(region({ role: 'alert' }, 'Upload failed'));
    await observed();

    expect(capture.heard()).toEqual(['Upload failed']);
  });

  it('keeps a role="status" inserted with its text in entries, not in heard', async () => {
    start();

    host.append(region({ role: 'status' }, 'Saved'));
    await observed();

    expect(capture.entries().map((entry) => [entry.text, entry.origin])).toEqual([
      ['Saved', 'insertion'],
    ]);
    expect(capture.heard()).toEqual([]);
  });

  it('does not hear a write under aria-busy and hears the flip that follows once', async () => {
    const status = region({ role: 'status', 'aria-busy': 'true' });
    host.append(status);
    start();

    status.textContent = '3 results';
    await observed();
    expect(capture.entries().map((entry) => entry.busy)).toEqual([true]);
    expect(capture.heard()).toEqual([]);

    status.setAttribute('aria-busy', 'false');
    await observed();

    expect(capture.entries().map((entry) => [entry.origin, entry.busy])).toEqual([
      ['mutation', true],
      ['busy-cleared', false],
    ]);
    expect(capture.heard()).toEqual(['3 results']);
  });

  it('hears an alert made live while holding text, not a status', async () => {
    const alert = region({}, 'Upload failed');
    const status = region({}, 'Saved');
    host.append(alert, status);
    start();

    alert.setAttribute('role', 'alert');
    status.setAttribute('role', 'status');
    await observed();

    expect(capture.entries().map((entry) => [entry.text, entry.origin])).toEqual([
      ['Upload failed', 'became-live'],
      ['Saved', 'became-live'],
    ]);
    expect(capture.heard()).toEqual(['Upload failed']);
  });

  it('counts the same text once unless the region was emptied between', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    start();

    polite.textContent = 'Saved';
    await observed();
    polite.textContent = 'Saved';
    await observed();
    expect(capture.heard()).toEqual(['Saved']);

    polite.textContent = '';
    await observed();
    polite.textContent = 'Saved';
    await observed();
    expect(capture.heard()).toEqual(['Saved', 'Saved']);
  });

  it('keeps writes inside hidden and behind an open aria-modal in entries only', async () => {
    const hidden = region({ 'aria-live': 'polite', hidden: '' });
    const behind = region({ 'aria-live': 'polite' });
    const modal = document.createElement('dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('open', '');
    host.append(hidden, behind, modal);
    start();

    hidden.textContent = 'Hidden';
    behind.textContent = 'Behind';
    await observed();

    expect(capture.entries().map((entry) => [entry.text, entry.suppressedBy])).toEqual([
      ['Hidden', 'hidden'],
      ['Behind', 'aria-modal'],
    ]);
    expect(capture.heard()).toEqual([]);
  });

  it('empties entries and heard on clear() and keeps recording', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    start();
    polite.textContent = 'First';
    await observed();

    capture.clear();
    expect(capture.entries()).toEqual([]);
    expect(capture.heard()).toEqual([]);

    polite.textContent = 'Second';
    await observed();
    expect(capture.heard()).toEqual(['Second']);
  });

  it('stops recording on stop() and keeps what it holds', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    start();
    polite.textContent = 'Before';
    await observed();

    capture.stop();
    polite.textContent = 'After';
    await observed();

    expect(capture.heard()).toEqual(['Before']);
  });

  it('drops a write the observer has not delivered yet when stopped', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    start();

    polite.textContent = 'Pending';
    capture.stop();
    await observed();

    expect(capture.entries()).toEqual([]);
  });

  it('keeps the heard reference across an entry that is not heard', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    start();
    polite.textContent = 'Saved';
    await observed();
    const before = capture.heard();

    host.append(region({ role: 'status' }, 'Inserted'));
    await observed();

    expect(capture.entries()).toHaveLength(2);
    expect(capture.heard()).toBe(before);
  });

  it('does not record text already present when it starts', async () => {
    host.append(region({ 'aria-live': 'polite' }, 'Already there'));
    start();
    await observed();

    expect(capture.entries()).toEqual([]);
  });

  it('honours limit', async () => {
    const polite = region({ 'aria-live': 'polite' });
    host.append(polite);
    capture = createAnnouncementCapture({ root: host, limit: 2 });

    for (const text of ['One', 'Two', 'Three']) {
      polite.textContent = text;
      await observed();
    }

    expect(capture.heard()).toEqual(['Two', 'Three']);
  });

  it('bounds the writes a busy region defers by limit', async () => {
    const log = region({ role: 'log', 'aria-busy': 'true' });
    host.append(log);
    capture = createAnnouncementCapture({ root: host, limit: 2 });

    for (const text of ['One', 'Two', 'Three']) {
      const line = document.createElement('p');
      line.textContent = text;
      log.append(line);
      await observed();
    }
    log.setAttribute('aria-busy', 'false');
    await observed();

    expect(capture.heard()).toEqual(['Two Three']);
  });

  describe('timing of a write 16 ms after the call', () => {
    function announceLater(target: HTMLElement, text: string): void {
      setTimeout(() => {
        target.textContent = text;
      }, 16);
    }

    it('under fake timers, is seen after advancing 16 ms and awaiting a microtask', async () => {
      vi.useFakeTimers();
      const polite = region({ 'aria-live': 'polite' });
      host.append(polite);
      start();

      announceLater(polite, 'Saved');
      vi.advanceTimersByTime(15);
      await Promise.resolve();
      expect(capture.heard()).toEqual([]);

      vi.advanceTimersByTime(1);
      expect(capture.heard()).toEqual([]);
      await Promise.resolve();
      expect(capture.heard()).toEqual(['Saved']);
    });

    it('under real timers, is seen after a timeout longer than 16 ms', async () => {
      const polite = region({ 'aria-live': 'polite' });
      host.append(polite);
      start();

      announceLater(polite, 'Saved');
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(capture.heard()).toEqual(['Saved']);
    });
  });
});
