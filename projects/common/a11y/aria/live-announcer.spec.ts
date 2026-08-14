import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from './live-announcer';

// Mirrors the module-private CLEAR_DELAY_MS in live-announcer.ts. Kept as a
// literal here (the const is not exported) so the 16ms flush stays a pinned,
// tested value rather than an asserted-but-unverified "sub-perceptual" claim.
const CLEAR_DELAY_MS = 16;

function politeEl(): HTMLElement | null {
  return document.body.querySelector('span[aria-live="polite"]');
}

function assertiveEl(): HTMLElement | null {
  return document.body.querySelector('span[aria-live="assertive"]');
}

describe('CngxLiveAnnouncer', () => {
  let announcer: CngxLiveAnnouncer;

  beforeEach(() => {
    vi.useFakeTimers();
    announcer = TestBed.inject(CngxLiveAnnouncer);
  });

  afterEach(() => {
    announcer.ngOnDestroy();
    vi.useRealTimers();
  });

  it('writes the message to the polite region one frame later', () => {
    announcer.announce('Saved');
    const region = politeEl();
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    // Cleared synchronously; written on flush.
    expect(region?.textContent).toBe('');
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(region?.textContent).toBe('Saved');
  });

  it('flushes after CLEAR_DELAY_MS, not synchronously and not one frame early', () => {
    announcer.announce('Saved');
    const region = politeEl();
    expect(region?.textContent).toBe('');
    vi.advanceTimersByTime(CLEAR_DELAY_MS - 1);
    expect(region?.textContent).toBe('');
    vi.advanceTimersByTime(1);
    expect(region?.textContent).toBe('Saved');
  });

  it('routes polite and assertive to two distinct nodes without cross-clobber', () => {
    announcer.announce('polite message');
    announcer.announce('urgent message', 'assertive');

    const polite = politeEl();
    const assertive = assertiveEl();
    expect(polite).not.toBeNull();
    expect(assertive).not.toBeNull();
    expect(polite).not.toBe(assertive);

    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    // Neither politeness cleared the other's pending write.
    expect(polite?.textContent).toBe('polite message');
    expect(assertive?.textContent).toBe('urgent message');
  });

  it('clears then re-sets so an identical consecutive message re-announces', () => {
    announcer.announce('Copied');
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    const region = politeEl();
    expect(region?.textContent).toBe('Copied');

    announcer.announce('Copied');
    // The clear is the content change the SR needs to re-read the same string.
    expect(region?.textContent).toBe('');
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(region?.textContent).toBe('Copied');
  });

  it('reuses one node per politeness across announcements', () => {
    announcer.announce('one');
    announcer.announce('two');
    announcer.announce('boom', 'assertive');
    expect(document.body.querySelectorAll('span[aria-live="polite"]').length).toBe(1);
    expect(document.body.querySelectorAll('span[aria-live="assertive"]').length).toBe(1);
  });

  it('removes both regions and cancels both pending timers on destroy', () => {
    announcer.announce('a');
    announcer.announce('b', 'assertive');
    expect(politeEl()).not.toBeNull();
    expect(assertiveEl()).not.toBeNull();

    announcer.ngOnDestroy();
    expect(politeEl()).toBeNull();
    expect(assertiveEl()).toBeNull();

    // The pending writes were cancelled: flushing must not resurrect content.
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(document.body.querySelector('span[aria-live]')).toBeNull();
  });
});

describe('CngxLiveAnnouncer - SSR', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('is a no-op with no browser and creates no region', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const announcer = TestBed.inject(CngxLiveAnnouncer);
    announcer.announce('nope');
    announcer.announce('urgent', 'assertive');

    expect(document.body.querySelector('span[aria-live]')).toBeNull();
    announcer.ngOnDestroy();
  });
});
