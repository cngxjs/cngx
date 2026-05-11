import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_MENU_ANNOUNCER_FACTORY,
  CngxMenuAnnouncer,
  type CngxMenuAnnouncerLike,
  injectMenuAnnouncer,
} from './menu-announcer';

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

describe('CNGX_MENU_ANNOUNCER_FACTORY', () => {
  beforeEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('default factory resolves to the root-scoped CngxMenuAnnouncer', () => {
    TestBed.configureTestingModule({});
    const factory = TestBed.inject(CNGX_MENU_ANNOUNCER_FACTORY);
    const fromFactory = TestBed.runInInjectionContext(() => factory());
    const direct = TestBed.inject(CngxMenuAnnouncer);
    expect(fromFactory).toBe(direct);
  });

  it('override via providers swaps the announcer for every consumer', () => {
    const calls: string[] = [];
    const stub: CngxMenuAnnouncerLike = {
      announce: (msg: string): void => {
        calls.push(msg);
      },
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_MENU_ANNOUNCER_FACTORY, useValue: () => stub }],
    });
    const factory = TestBed.inject(CNGX_MENU_ANNOUNCER_FACTORY);
    const announcer = TestBed.runInInjectionContext(() => factory());
    announcer.announce('Submenu opened');
    expect(announcer).toBe(stub);
    expect(calls).toEqual(['Submenu opened']);
    expect(document.querySelector('.cngx-menu-announcer')).toBeNull();
  });

  it('injectMenuAnnouncer resolves through the factory token', () => {
    const stub: CngxMenuAnnouncerLike = { announce: () => undefined };
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_MENU_ANNOUNCER_FACTORY, useValue: () => stub }],
    });
    const injector = TestBed.inject(Injector);
    const captured = runInInjectionContext(injector, () => injectMenuAnnouncer());
    expect(captured).toBe(stub);
  });
});
