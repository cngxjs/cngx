import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

import {
  CNGX_MENU_ANNOUNCER_FACTORY,
  CngxMenuAnnouncer,
  type CngxMenuAnnouncerLike,
  injectMenuAnnouncer,
} from './menu-announcer';

// Non-generic vi.spyOn call so the spy type is inferred; the explicit
// vi.spyOn<T, K> generic form trips vitest's overload constraint here.
function makeLiveSpy(): ReturnType<typeof vi.fn> {
  return vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce').mockImplementation(() => {});
}

describe('CngxMenuAnnouncer', () => {
  let live: ReturnType<typeof makeLiveSpy>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    live = makeLiveSpy();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates a non-empty message to the shared live region as polite', () => {
    const announcer = TestBed.inject(CngxMenuAnnouncer);
    announcer.announce('Submenu opened');
    expect(live).toHaveBeenCalledExactlyOnceWith('Submenu opened', 'polite');
  });

  it('ignores empty messages so the live region is never touched', () => {
    const announcer = TestBed.inject(CngxMenuAnnouncer);
    announcer.announce('');
    expect(live).not.toHaveBeenCalled();
  });
});

describe('CNGX_MENU_ANNOUNCER_FACTORY', () => {
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
