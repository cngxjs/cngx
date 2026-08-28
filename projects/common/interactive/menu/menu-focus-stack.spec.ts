import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CngxActiveDescendant } from '@cngx/common/a11y';

import {
  CNGX_MENU_FOCUS_STACK_FACTORY,
  connectSubmenuHoverToFocusStack,
  createMenuFocusStack,
  type CngxMenuFocusStackPopoverRef,
} from './menu-focus-stack';
import type { CngxMenuHost } from './menu-host.token';
import { createW3CMenuStrategy } from './menu-nav-strategy';
import type { CngxMenuSubmenuLike } from './menu-submenu.token';

interface MockAd {
  activeId: ReturnType<typeof signal<string | null>>;
  activeItem: ReturnType<typeof signal<unknown>>;
  highlightFirst: ReturnType<typeof vi.fn>;
  activateCurrent: ReturnType<typeof vi.fn>;
}

function mockMenu(): { host: CngxMenuHost; ad: MockAd; submenus: ReturnType<typeof signal<readonly CngxMenuSubmenuLike[]>> } {
  const ad: MockAd = {
    activeId: signal<string | null>(null),
    activeItem: signal<unknown>(null),
    highlightFirst: vi.fn(),
    activateCurrent: vi.fn(),
  };
  const submenus = signal<readonly CngxMenuSubmenuLike[]>([]);
  const host: CngxMenuHost = {
    ad: ad as unknown as CngxActiveDescendant,
    submenuItems: submenus,
    focus: vi.fn(),
    registerSubmenuItem: () => () => {},
  };
  return { host, ad, submenus };
}

function mockSubmenu(id: string, inner: CngxMenuHost): CngxMenuSubmenuLike {
  return {
    id,
    inner,
    isOpen: signal(false),
    open: vi.fn(),
    close: vi.fn(),
  };
}

function keyEvent(): KeyboardEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe('createMenuFocusStack', () => {
  let root: ReturnType<typeof mockMenu>;
  let popover: CngxMenuFocusStackPopoverRef;

  beforeEach(() => {
    root = mockMenu();
    popover = { hide: vi.fn(() => {}) };
  });

  function build() {
    return createMenuFocusStack({
      rootMenu: () => root.host,
      popover: () => popover,
      nav: createW3CMenuStrategy(),
      document,
    });
  }

  it('effectiveMenu returns the root while the stack is empty', () => {
    const stack = build();
    expect(stack.effectiveMenu()).toBe(root.host);
    expect(stack.stack().length).toBe(0);
  });

  it('ArrowRight on a closed submenu parent opens it, pushes the stack, and highlights its first item', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.ad.activeId.set('sub-1');

    const stack = build();
    const event = keyEvent();
    stack.handleArrowRight(root.host, event);

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([inner.host]);
    expect(stack.effectiveMenu()).toBe(inner.host);
    expect(inner.ad.highlightFirst).toHaveBeenCalledOnce();
  });

  it('openSubmenuFor opens the submenu, pushes the stack, and highlights the inner first item', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);

    const stack = build();
    stack.openSubmenuFor(submenu);

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([inner.host]);
    expect(stack.effectiveMenu()).toBe(inner.host);
    expect(inner.ad.highlightFirst).toHaveBeenCalledOnce();
  });

  it('openSubmenuFor is a no-op when the submenu is already on the stack', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);

    const stack = build();
    stack.openSubmenuFor(submenu);
    stack.openSubmenuFor(submenu);

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([inner.host]);
    expect(inner.ad.highlightFirst).toHaveBeenCalledOnce();
  });

  it('openSubmenuFor chain-corrects: opening a sibling parent pops the other branch first', () => {
    const innerA = mockMenu();
    const innerB = mockMenu();
    const submenuA = mockSubmenu('sub-a', innerA.host);
    const submenuB = mockSubmenu('sub-b', innerB.host);
    root.submenus.set([submenuA, submenuB]);

    const stack = build();
    stack.openSubmenuFor(submenuA);
    expect(stack.stack()).toEqual([innerA.host]);

    stack.openSubmenuFor(submenuB);

    expect(submenuA.close).toHaveBeenCalledOnce();
    expect(submenuB.open).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([innerB.host]);
    expect(stack.effectiveMenu()).toBe(innerB.host);
  });

  it('closeSubmenuFor pops the submenu and its open descendants innermost-first', () => {
    const innerA = mockMenu();
    const innerB = mockMenu();
    const submenuA = mockSubmenu('sub-a', innerA.host);
    const submenuB = mockSubmenu('sub-b', innerB.host);
    root.submenus.set([submenuA]);
    innerA.submenus.set([submenuB]);

    const stack = build();
    stack.openSubmenuFor(submenuA);
    stack.openSubmenuFor(submenuB);
    expect(stack.stack()).toEqual([innerA.host, innerB.host]);

    stack.closeSubmenuFor(submenuA);

    expect(submenuB.close).toHaveBeenCalledOnce();
    expect(submenuA.close).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([]);
    expect(stack.effectiveMenu()).toBe(root.host);
  });

  it('closeSubmenuFor on a non-stack-tracked submenu only closes the popover', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);

    const stack = build();
    stack.closeSubmenuFor(submenu);

    expect(submenu.close).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([]);
  });

  it('noteSubmenuOpened pushes and highlights the inner first item without opening the submenu', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);

    const stack = build();
    stack.noteSubmenuOpened(submenu);

    expect(submenu.open).not.toHaveBeenCalled();
    expect(stack.stack()).toEqual([inner.host]);
    expect(stack.effectiveMenu()).toBe(inner.host);
    expect(inner.ad.highlightFirst).toHaveBeenCalledOnce();
  });

  it('noteSubmenuOpened is a no-op when the submenu is already on the stack', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.ad.activeId.set('sub-1');

    const stack = build();
    stack.openSubmenuFor(submenu);
    stack.noteSubmenuOpened(submenu);

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([inner.host]);
    expect(inner.ad.highlightFirst).toHaveBeenCalledOnce();
  });

  it('activeSubmenu resolves the effective menu active item submenu, else undefined', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);

    const stack = build();
    expect(stack.activeSubmenu()).toBeUndefined();

    root.ad.activeId.set('sub-1');
    expect(stack.activeSubmenu()).toBe(submenu);

    root.ad.activeId.set('leaf');
    expect(stack.activeSubmenu()).toBeUndefined();
  });

  it('ignores an inert submenu brain whose inner menu never resolves (leaf item in the organism)', () => {
    const inert: CngxMenuSubmenuLike = {
      id: 'leaf',
      inner: null as unknown as CngxMenuHost,
      isOpen: signal(false),
      open: vi.fn(),
      close: vi.fn(),
    };
    root.submenus.set([inert]);
    root.ad.activeId.set('leaf');

    const stack = build();
    stack.openSubmenuFor(inert);
    stack.noteSubmenuOpened(inert);
    stack.handleArrowRight(root.host, keyEvent());

    expect(stack.stack().length).toBe(0);
  });

  it('openSubmenuFor on an inert brain leaves an open sibling branch untouched (leaf hover sweep)', () => {
    const innerA = mockMenu();
    const submenuA = mockSubmenu('sub-a', innerA.host);
    const inertLeaf: CngxMenuSubmenuLike = {
      id: 'leaf',
      inner: null as unknown as CngxMenuHost,
      isOpen: signal(false),
      open: vi.fn(),
      close: vi.fn(),
    };
    root.submenus.set([submenuA, inertLeaf]);

    const stack = build();
    stack.openSubmenuFor(submenuA);
    expect(stack.stack()).toEqual([innerA.host]);

    stack.openSubmenuFor(inertLeaf);

    expect(submenuA.close).not.toHaveBeenCalled();
    expect(inertLeaf.open).not.toHaveBeenCalled();
    expect(stack.stack()).toEqual([innerA.host]);
  });

  it('closeSubmenuFor on an inert brain is a no-op', () => {
    const inertLeaf: CngxMenuSubmenuLike = {
      id: 'leaf',
      inner: null as unknown as CngxMenuHost,
      isOpen: signal(false),
      open: vi.fn(),
      close: vi.fn(),
    };
    root.submenus.set([inertLeaf]);

    const stack = build();
    stack.closeSubmenuFor(inertLeaf);

    expect(inertLeaf.close).not.toHaveBeenCalled();
    expect(stack.stack()).toEqual([]);
  });

  it('ArrowLeft pops the innermost submenu level', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.ad.activeId.set('sub-1');

    const stack = build();
    stack.handleArrowRight(root.host, keyEvent());
    expect(stack.stack().length).toBe(1);

    stack.handleArrowLeft(stack.effectiveMenu(), keyEvent());
    expect(submenu.close).toHaveBeenCalledOnce();
    expect(stack.stack().length).toBe(0);
  });

  it('Escape pops one level when a submenu is open, else hides the popover', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.ad.activeId.set('sub-1');

    const stack = build();
    stack.handleArrowRight(root.host, keyEvent());

    const popEvent = keyEvent();
    stack.handleEscape(popEvent);
    expect(popEvent.stopPropagation).toHaveBeenCalledOnce();
    expect(submenu.close).toHaveBeenCalledOnce();
    expect(popover.hide).not.toHaveBeenCalled();

    stack.handleEscape(keyEvent());
    expect(popover.hide).toHaveBeenCalledOnce();
  });

  it('activation on a leaf activates the item then closes the whole stack', () => {
    root.ad.activeItem.set({});
    const stack = build();
    stack.handleActivation(root.host, keyEvent());

    expect(root.ad.activateCurrent).toHaveBeenCalledOnce();
    expect(popover.hide).toHaveBeenCalledOnce();
  });

  it('activation with no active item is a no-op', () => {
    root.ad.activeItem.set(null);
    const stack = build();
    stack.handleActivation(root.host, keyEvent());

    expect(root.ad.activateCurrent).not.toHaveBeenCalled();
    expect(popover.hide).not.toHaveBeenCalled();
  });

  it('reset closes open submenus innermost-first and clears the stack without hiding the popover', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.ad.activeId.set('sub-1');

    const stack = build();
    stack.handleArrowRight(root.host, keyEvent());
    expect(stack.stack().length).toBe(1);

    stack.reset();

    expect(submenu.close).toHaveBeenCalledOnce();
    expect(stack.stack().length).toBe(0);
    expect(stack.effectiveMenu()).toBe(root.host);
    // The close path hides the root popover itself; reset must not double-hide.
    expect(popover.hide).not.toHaveBeenCalled();
  });

  it('captureFocus snapshots the active element and restoreFocus returns focus after the microtask', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const stack = build();
    stack.captureFocus();

    const other = document.createElement('button');
    document.body.appendChild(other);
    other.focus();
    expect(document.activeElement).toBe(other);

    stack.restoreFocus();
    await Promise.resolve();
    expect(document.activeElement).toBe(button);

    button.remove();
    other.remove();
  });
});

describe('connectSubmenuHoverToFocusStack', () => {
  let root: ReturnType<typeof mockMenu>;
  let popover: CngxMenuFocusStackPopoverRef;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    root = mockMenu();
    popover = { hide: vi.fn(() => {}) };
  });

  function buildConnected() {
    const stack = createMenuFocusStack({
      rootMenu: () => root.host,
      popover: () => popover,
      nav: createW3CMenuStrategy(),
      document,
    });
    TestBed.runInInjectionContext(() =>
      connectSubmenuHoverToFocusStack({ focusStack: stack, rootMenu: () => root.host }),
    );
    TestBed.tick();
    return stack;
  }

  it('routes settled hover-intent edges through openSubmenuFor / closeSubmenuFor', () => {
    const inner = mockMenu();
    const hoverIntent = signal(false);
    const submenu: CngxMenuSubmenuLike = { ...mockSubmenu('sub-1', inner.host), hoverIntent };
    root.submenus.set([submenu]);

    const stack = buildConnected();
    hoverIntent.set(true);
    TestBed.tick();

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([inner.host]);
    expect(inner.ad.highlightFirst).toHaveBeenCalledOnce();

    hoverIntent.set(false);
    TestBed.tick();

    expect(submenu.close).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([]);
  });

  it('routes intent of a submenu registered inside an open submenu level', () => {
    const innerA = mockMenu();
    const innerB = mockMenu();
    const hoverIntent = signal(false);
    const submenuA = mockSubmenu('sub-a', innerA.host);
    const submenuB: CngxMenuSubmenuLike = { ...mockSubmenu('sub-b', innerB.host), hoverIntent };
    root.submenus.set([submenuA]);
    innerA.submenus.set([submenuB]);

    const stack = buildConnected();
    stack.openSubmenuFor(submenuA);
    TestBed.tick();
    hoverIntent.set(true);
    TestBed.tick();

    expect(submenuB.open).toHaveBeenCalledOnce();
    expect(stack.stack()).toEqual([innerA.host, innerB.host]);
  });

  it('observes intent decay of a submenu whose menu left the chain (no stale suppression)', () => {
    const innerA = mockMenu();
    const innerB = mockMenu();
    const hoverIntent = signal(false);
    const submenuA = mockSubmenu('sub-a', innerA.host);
    const submenuB: CngxMenuSubmenuLike = { ...mockSubmenu('sub-b', innerB.host), hoverIntent };
    root.submenus.set([submenuA]);
    innerA.submenus.set([submenuB]);

    const stack = buildConnected();
    stack.openSubmenuFor(submenuA);
    TestBed.tick();
    hoverIntent.set(true);
    TestBed.tick();
    expect(stack.stack()).toEqual([innerA.host, innerB.host]);

    // Non-Escape dismissal clears the chain; the pointer decays afterwards,
    // while B's menu is no longer part of the open chain.
    stack.reset();
    hoverIntent.set(false);
    TestBed.tick();

    // Re-open the branch and hover B again: the false edge above must have
    // been observed, or this true edge would be swallowed as a non-change.
    stack.openSubmenuFor(submenuA);
    hoverIntent.set(true);
    TestBed.tick();

    expect(submenuB.open).toHaveBeenCalledTimes(2);
    expect(stack.stack()).toEqual([innerA.host, innerB.host]);
  });

  it('leaves a keyboard-opened submenu alone while its intent never settled true', () => {
    const inner = mockMenu();
    const hoverIntent = signal(false);
    const submenu: CngxMenuSubmenuLike = { ...mockSubmenu('sub-1', inner.host), hoverIntent };
    root.submenus.set([submenu]);

    const stack = buildConnected();
    stack.openSubmenuFor(submenu);
    TestBed.tick();

    expect(submenu.close).not.toHaveBeenCalled();
    expect(stack.stack()).toEqual([inner.host]);
  });
});

describe('CNGX_MENU_FOCUS_STACK_FACTORY', () => {
  it('default token provides createMenuFocusStack', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CNGX_MENU_FOCUS_STACK_FACTORY)).toBe(createMenuFocusStack);
  });
});
