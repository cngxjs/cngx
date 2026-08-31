import { afterEach, describe, expect, it } from 'vitest';

import { createScrollLock } from './scroll-lock-core';

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
