import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPinnedScrollLock, createScrollLock } from './scroll-lock-core';

describe('createScrollLock', () => {
  const html = document.documentElement;

  afterEach(() => {
    html.style.overflow = '';
    html.style.scrollbarGutter = '';
    delete html.dataset['cngxPrevOverflow'];
    delete html.dataset['cngxPrevScrollbarGutter'];
  });

  it('locks on first acquire and restores the saved styles on last release', () => {
    html.style.overflow = 'auto';
    const release = createScrollLock(html);
    expect(html.style.overflow).toBe('hidden');
    expect(html.style.scrollbarGutter).toBe('stable');

    release();
    expect(html.style.overflow).toBe('auto');
    expect(html.style.scrollbarGutter).toBe('');
  });

  it('keeps the lock while any acquisition is outstanding (interleaved owners)', () => {
    // The regression this file exists for: a dialog lock and a CngxScrollLock
    // lock used to live in two separate WeakMaps sharing the same dataset
    // keys - interleaving them corrupted the saved overflow value.
    html.style.overflow = 'scroll';
    const releaseDialog = createScrollLock(html);
    const releaseDirective = createScrollLock(html);

    releaseDialog();
    expect(html.style.overflow).toBe('hidden');

    releaseDirective();
    expect(html.style.overflow).toBe('scroll');
    expect(html.dataset['cngxPrevOverflow']).toBeUndefined();
  });

  it('release is idempotent - a double release cannot unlock a live holder', () => {
    const releaseA = createScrollLock(html);
    const releaseB = createScrollLock(html);

    releaseA();
    releaseA();
    expect(html.style.overflow).toBe('hidden');

    releaseB();
    expect(html.style.overflow).toBe('');
  });
});

describe('createScrollLock on scroll containers', () => {
  function container(): HTMLElement {
    const el = document.createElement('div');
    el.style.overflow = 'auto';
    document.body.appendChild(el);
    return el;
  }

  it('locks two targets independently', () => {
    const a = container();
    const b = container();
    const releaseA = createScrollLock(a);
    const releaseB = createScrollLock(b);
    expect(a.style.overflow).toBe('hidden');
    expect(b.style.overflow).toBe('hidden');

    releaseA();
    expect(a.style.overflow).toBe('auto');
    expect(b.style.overflow).toBe('hidden');

    releaseB();
    expect(b.style.overflow).toBe('auto');
    a.remove();
    b.remove();
  });

  it('keeps nested acquisitions on one target until the last release', () => {
    const el = container();
    const outer = createScrollLock(el);
    const inner = createScrollLock(el);

    inner();
    expect(el.style.overflow).toBe('hidden');
    expect(el.style.scrollbarGutter).toBe('stable');

    outer();
    expect(el.style.overflow).toBe('auto');
    expect(el.dataset['cngxPrevOverflow']).toBeUndefined();
    el.remove();
  });

  it('leaves the document root alone while a container is locked', () => {
    const el = container();
    const release = createScrollLock(el);
    expect(document.documentElement.style.overflow).not.toBe('hidden');
    release();
    el.remove();
  });
});

describe('createPinnedScrollLock', () => {
  const html = document.documentElement;
  const body = document.body;
  let scrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(320);
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(0);
    scrollTo = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo as unknown as typeof window.scrollTo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    body.removeAttribute('style');
    html.style.overflow = '';
    html.style.scrollbarGutter = '';
  });

  it('pins the body at -scrollY and restores it on release', () => {
    body.style.color = 'red';
    const release = createPinnedScrollLock(html);
    expect(body.style.position).toBe('fixed');
    expect(body.style.top).toBe('-320px');
    expect(body.style.overflow).toBe('hidden');
    expect(html.style.overflow).toBe('hidden');

    release();
    expect(body.style.position).toBe('');
    expect(body.style.top).toBe('');
    expect(body.style.color).toBe('red');
    expect(html.style.overflow).toBe('');
  });

  it('restores only the properties it pinned and keeps styles set meanwhile', () => {
    body.style.position = 'relative';
    const release = createPinnedScrollLock(html);
    body.style.paddingRight = '15px';
    release();
    expect(body.style.position).toBe('relative');
    expect(body.style.paddingRight).toBe('15px');
    expect(body.style.top).toBe('');
  });

  it('scrolls back to the saved position on the last release only', () => {
    const releaseA = createPinnedScrollLock(html);
    const releaseB = createPinnedScrollLock(html);

    releaseA();
    expect(body.style.position).toBe('fixed');
    expect(scrollTo).not.toHaveBeenCalled();

    releaseB();
    expect(body.style.position).toBe('');
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 320, behavior: 'instant' });
  });

  it('shares the html overflow with createScrollLock owners', () => {
    html.style.overflow = 'auto';
    const releasePin = createPinnedScrollLock(html);
    const releaseLock = createScrollLock(html);

    releasePin();
    expect(html.style.overflow).toBe('hidden');
    expect(body.style.position).toBe('');

    releaseLock();
    expect(html.style.overflow).toBe('auto');
  });

  it('release is idempotent', () => {
    const releaseA = createPinnedScrollLock(html);
    const releaseB = createPinnedScrollLock(html);

    releaseA();
    releaseA();
    expect(body.style.position).toBe('fixed');

    releaseB();
    releaseB();
    expect(body.style.position).toBe('');
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});
