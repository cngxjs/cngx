import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CngxActiveDescendant } from '@cngx/common/a11y';

import {
  createContextMenuTriggerCore,
  type CngxContextMenuTriggerCore,
  type CngxContextMenuTriggerPopoverRef,
} from './context-menu-trigger-core';
import type { CngxMenuDismissHandlerFactory } from './dismiss-handler';
import { createMenuFocusStack } from './menu-focus-stack';
import { DEFAULT_MENU_CONFIG } from './menu-config';
import type { CngxMenuHost } from './menu-host.token';
import { createW3CMenuStrategy } from './menu-nav-strategy';
import type { CngxMenuSubmenuLike } from './menu-submenu.token';

interface MockMenu {
  host: CngxMenuHost;
  activeId: ReturnType<typeof signal<string | null>>;
  highlightFirst: ReturnType<typeof vi.fn>;
  submenus: ReturnType<typeof signal<readonly CngxMenuSubmenuLike[]>>;
}

function mockMenu(): MockMenu {
  const activeId = signal<string | null>(null);
  const highlightFirst = vi.fn();
  const submenus = signal<readonly CngxMenuSubmenuLike[]>([]);
  const ad = {
    activeId,
    activeItem: signal<unknown>(null),
    highlightFirst,
    activateCurrent: vi.fn(),
  } as unknown as CngxActiveDescendant;
  return {
    host: { ad, submenuItems: submenus, focus: vi.fn(), registerSubmenuItem: () => () => {} },
    activeId,
    highlightFirst,
    submenus,
  };
}

function mockSubmenu(id: string, inner: CngxMenuHost): CngxMenuSubmenuLike {
  return { id, inner, isOpen: signal(false), open: vi.fn(), close: vi.fn() };
}

const noopDismissFactory: CngxMenuDismissHandlerFactory = () => ({ attach: () => () => {} });

function key(k: string): KeyboardEvent {
  return {
    key: k,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe('context-menu trigger core - submenu keyboard routing', () => {
  let root: MockMenu;
  let visible: ReturnType<typeof signal<boolean>>;
  let core: CngxContextMenuTriggerCore;

  beforeEach(() => {
    root = mockMenu();
    visible = signal(true);
    const popover: CngxContextMenuTriggerPopoverRef = {
      isVisible: () => visible(),
      hide: () => visible.set(false),
      elementRef: { nativeElement: document.createElement('div') },
      show: () => visible.set(true),
      anchorElement: { set: vi.fn() },
      id: () => 'test',
    };
    core = createContextMenuTriggerCore({
      menu: () => root.host,
      popover: () => popover,
      hostElement: document.createElement('div'),
      document,
      menuConfig: DEFAULT_MENU_CONFIG,
      dismissFactory: noopDismissFactory,
      announcer: { announce: vi.fn() },
      nav: createW3CMenuStrategy(),
      direction: signal<'ltr' | 'rtl'>('ltr'),
      focusStackFactory: createMenuFocusStack,
    });
  });

  it('ArrowRight opens the active item submenu and transfers focus into it', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    const event = key('ArrowRight');
    core.handleKeydown(event);

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(inner.highlightFirst).toHaveBeenCalledOnce();
  });

  it('openActiveSubmenu opens the active parent submenu and highlights its first item', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    core.openActiveSubmenu();

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(inner.highlightFirst).toHaveBeenCalledOnce();
  });

  it('openActiveSubmenu is a no-op on a leaf item', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('leaf-item');

    core.openActiveSubmenu();

    expect(submenu.open).not.toHaveBeenCalled();
  });

  it('openActiveSubmenu does not double-push an already-open submenu', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    core.openActiveSubmenu();
    core.openActiveSubmenu();

    expect(submenu.open).toHaveBeenCalledOnce();
    expect(inner.highlightFirst).toHaveBeenCalledOnce();
  });

  it('noteActiveSubmenuOpened stack-tracks the active submenu without opening it, so ArrowLeft pops it', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    core.noteActiveSubmenuOpened();
    expect(submenu.open).not.toHaveBeenCalled();
    expect(inner.highlightFirst).toHaveBeenCalledOnce();

    core.handleKeydown(key('ArrowLeft'));
    expect(submenu.close).toHaveBeenCalledOnce();
  });

  it('noteActiveSubmenuOpened is a no-op on a leaf item', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('leaf-item');

    core.noteActiveSubmenuOpened();

    expect(submenu.open).not.toHaveBeenCalled();
    expect(inner.highlightFirst).not.toHaveBeenCalled();
  });

  it('ArrowLeft pops the current submenu level', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    core.handleKeydown(key('ArrowRight'));
    core.handleKeydown(key('ArrowLeft'));

    expect(submenu.close).toHaveBeenCalledOnce();
  });

  it('Escape closes the stack innermost-first', () => {
    const inner1 = mockMenu();
    const inner2 = mockMenu();
    const sub1 = mockSubmenu('sub-1', inner1.host);
    const sub2 = mockSubmenu('sub-2', inner2.host);
    root.submenus.set([sub1]);
    root.activeId.set('sub-1');
    inner1.submenus.set([sub2]);
    inner1.activeId.set('sub-2');

    core.handleKeydown(key('ArrowRight'));
    core.handleKeydown(key('ArrowRight'));

    const order: string[] = [];
    (sub2.close as ReturnType<typeof vi.fn>).mockImplementation(() => order.push('sub-2'));
    (sub1.close as ReturnType<typeof vi.fn>).mockImplementation(() => order.push('sub-1'));

    const first = key('Escape');
    core.handleKeydown(first);
    expect(first.stopPropagation).toHaveBeenCalledOnce();

    core.handleKeydown(key('Escape'));

    expect(order).toEqual(['sub-2', 'sub-1']);
  });

  it('root-level Escape is left to the popover global listener (no stack pop)', () => {
    const event = key('Escape');
    core.handleKeydown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it('routes nothing while the popover is closed', () => {
    visible.set(false);
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    core.handleKeydown(key('ArrowRight'));

    expect(submenu.open).not.toHaveBeenCalled();
  });

  it('resets the submenu stack on a non-Escape dismissal so a reopen starts from the root', () => {
    const inner = mockMenu();
    const submenu = mockSubmenu('sub-1', inner.host);
    root.submenus.set([submenu]);
    root.activeId.set('sub-1');

    // Open the submenu by keyboard, then dismiss the root the way outside-click
    // / blur / scroll do - via the isOpen effect calling syncOpenState(false),
    // not through Escape (which pops the stack itself).
    core.handleKeydown(key('ArrowRight'));
    expect(submenu.open).toHaveBeenCalledOnce();
    core.syncOpenState(false);
    expect(submenu.close).toHaveBeenCalledOnce();

    // Reopen: the stack is empty again, so ArrowRight opens the root's submenu
    // a second time. Without the reset, effectiveMenu() would still be the
    // (now-closed) inner submenu and ArrowRight would be a no-op.
    visible.set(true);
    core.handleKeydown(key('ArrowRight'));
    expect(submenu.open).toHaveBeenCalledTimes(2);
  });
});
