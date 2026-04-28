import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_MENU_NAV_STRATEGY,
  createW3CMenuStrategy,
  type CngxMenuNavContext,
} from './menu-nav-strategy';

const ctx = (over: Partial<CngxMenuNavContext> = {}): CngxMenuNavContext => ({
  activeId: 'a',
  hasSubmenu: false,
  submenuOpen: false,
  ...over,
});

describe('createW3CMenuStrategy', () => {
  const strategy = createW3CMenuStrategy();

  describe('onArrowRight', () => {
    it('returns noop when no active item', () => {
      expect(strategy.onArrowRight(ctx({ activeId: null }))).toEqual({ kind: 'noop' });
    });

    it('returns noop on a leaf item without submenu', () => {
      expect(strategy.onArrowRight(ctx({ hasSubmenu: false }))).toEqual({ kind: 'noop' });
    });

    it('opens a submenu when the parent is closed', () => {
      expect(strategy.onArrowRight(ctx({ hasSubmenu: true, submenuOpen: false }))).toEqual({
        kind: 'open-submenu',
        id: 'a',
      });
    });

    it('returns noop when the submenu is already open (focus belongs to the submenu)', () => {
      expect(strategy.onArrowRight(ctx({ hasSubmenu: true, submenuOpen: true }))).toEqual({
        kind: 'noop',
      });
    });
  });

  describe('onArrowLeft', () => {
    it('closes the submenu when one is open', () => {
      expect(strategy.onArrowLeft(ctx({ submenuOpen: true }))).toEqual({ kind: 'close-submenu' });
    });

    it('falls through to move-to-parent otherwise', () => {
      expect(strategy.onArrowLeft(ctx({ submenuOpen: false }))).toEqual({
        kind: 'move-to-parent',
      });
    });
  });
});

describe('CNGX_MENU_NAV_STRATEGY', () => {
  it('default factory provides the W3C strategy', () => {
    TestBed.configureTestingModule({});
    const strategy = TestBed.inject(CNGX_MENU_NAV_STRATEGY);
    expect(strategy.onArrowRight(ctx({ hasSubmenu: true, submenuOpen: false }))).toEqual({
      kind: 'open-submenu',
      id: 'a',
    });
  });

  it('override via providers replaces the default', () => {
    const noopAll = {
      onArrowRight: () => ({ kind: 'noop' as const }),
      onArrowLeft: () => ({ kind: 'noop' as const }),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_MENU_NAV_STRATEGY, useValue: noopAll }],
    });
    const strategy = TestBed.inject(CNGX_MENU_NAV_STRATEGY);
    expect(strategy.onArrowRight(ctx({ hasSubmenu: true }))).toEqual({ kind: 'noop' });
    expect(strategy.onArrowLeft(ctx({ submenuOpen: true }))).toEqual({ kind: 'noop' });
  });
});
