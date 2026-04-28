import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxMenuAnnouncer } from './menu-announcer';

describe('CngxMenuAnnouncer', () => {
  beforeEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('creates a polite live region on first announce', () => {
    const announcer = TestBed.inject(CngxMenuAnnouncer);
    expect(document.querySelector('.cngx-menu-announcer')).toBeNull();

    announcer.announce('Submenu opened');

    const region = document.querySelector('.cngx-menu-announcer');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.getAttribute('aria-atomic')).toBe('true');
  });

  it('writes the message after the clear-then-set debounce', () => {
    const announcer = TestBed.inject(CngxMenuAnnouncer);
    announcer.announce('Item activated');
    const region = document.querySelector('.cngx-menu-announcer') as HTMLElement;
    expect(region.textContent).toBe('');

    vi.advanceTimersByTime(20);
    expect(region.textContent).toBe('Item activated');
  });

  it('reuses the same region across announces', () => {
    const announcer = TestBed.inject(CngxMenuAnnouncer);
    announcer.announce('First');
    vi.advanceTimersByTime(20);
    announcer.announce('Second');
    vi.advanceTimersByTime(20);
    expect(document.querySelectorAll('.cngx-menu-announcer')).toHaveLength(1);
    expect(document.querySelector('.cngx-menu-announcer')?.textContent).toBe('Second');
  });

  it('ignores empty messages', () => {
    const announcer = TestBed.inject(CngxMenuAnnouncer);
    announcer.announce('');
    expect(document.querySelector('.cngx-menu-announcer')).toBeNull();
  });
});
