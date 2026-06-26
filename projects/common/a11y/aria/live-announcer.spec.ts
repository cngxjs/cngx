import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from './live-announcer';

function regionEl(): HTMLElement | null {
  return document.body.querySelector('span[aria-live]');
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

  it('writes the message to one polite region on the next macrotask', () => {
    announcer.announce('Saved');
    const region = regionEl();
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    // Cleared synchronously; written on flush.
    expect(region?.textContent).toBe('');
    vi.runAllTimers();
    expect(region?.textContent).toBe('Saved');
  });

  it('clears then re-sets so an identical consecutive message re-announces', () => {
    announcer.announce('Copied');
    vi.runAllTimers();
    const region = regionEl();
    expect(region?.textContent).toBe('Copied');

    announcer.announce('Copied');
    // The clear is the content change the SR needs to re-read the same string.
    expect(region?.textContent).toBe('');
    vi.runAllTimers();
    expect(region?.textContent).toBe('Copied');
  });

  it('reuses a single region across announcements', () => {
    announcer.announce('one');
    announcer.announce('two');
    expect(document.body.querySelectorAll('span[aria-live]').length).toBe(1);
  });

  it('sets aria-live="assertive" for assertive announcements', () => {
    announcer.announce('Save failed', 'assertive');
    expect(regionEl()?.getAttribute('aria-live')).toBe('assertive');
  });

  it('removes the region on destroy', () => {
    announcer.announce('bye');
    expect(regionEl()).not.toBeNull();
    announcer.ngOnDestroy();
    expect(regionEl()).toBeNull();
  });
});
