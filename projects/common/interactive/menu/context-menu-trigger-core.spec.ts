import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CngxActiveDescendant } from '@cngx/common/a11y';

import {
  createContextMenuTriggerCore,
  type CngxContextMenuTriggerPopoverRef,
} from './context-menu-trigger-core';
import type { CngxMenuDismissHandlerFactory } from './dismiss-handler';
import { DEFAULT_MENU_CONFIG } from './menu-config';
import type { CngxMenuHost } from './menu-host.token';

function mockPopover(): CngxContextMenuTriggerPopoverRef & {
  show: ReturnType<typeof vi.fn>;
  visible: ReturnType<typeof signal<boolean>>;
} {
  const visible = signal(false);
  const show = vi.fn(() => visible.set(true));
  return {
    show,
    visible,
    isVisible: () => visible(),
    hide: () => visible.set(false),
    elementRef: { nativeElement: document.createElement('div') },
    anchorElement: { set: vi.fn() },
    id: () => 'test',
  };
}

function mockMenu(): CngxMenuHost & { highlightFirst: ReturnType<typeof vi.fn> } {
  const highlightFirst = vi.fn();
  return {
    ad: { highlightFirst } as unknown as CngxActiveDescendant,
    submenuItems: signal([]),
    focus: vi.fn(),
    highlightFirst,
  };
}

const noopDismissFactory: CngxMenuDismissHandlerFactory = () => ({ attach: () => () => {} });

function mouse(over: Partial<MouseEvent> = {}): MouseEvent {
  return {
    clientX: 10,
    clientY: 20,
    preventDefault: vi.fn(),
    ...over,
  } as unknown as MouseEvent;
}

describe('createContextMenuTriggerCore', () => {
  let popover: ReturnType<typeof mockPopover>;
  let menu: ReturnType<typeof mockMenu>;
  const host = document.createElement('div');

  beforeEach(() => {
    popover = mockPopover();
    menu = mockMenu();
  });

  function build(over: Partial<Parameters<typeof createContextMenuTriggerCore>[0]> = {}) {
    return createContextMenuTriggerCore({
      menu: () => menu,
      popover: () => popover,
      hostElement: host,
      document,
      menuConfig: DEFAULT_MENU_CONFIG,
      dismissFactory: noopDismissFactory,
      announcer: { announce: vi.fn() },
      ...over,
    });
  }

  it('default resolveOpen prevents default and opens the popover on contextmenu', () => {
    const core = build();
    const event = mouse();
    core.handleContextMenu(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(popover.show).toHaveBeenCalledOnce();
    expect(menu.highlightFirst).toHaveBeenCalledOnce();
  });

  it('resolveOpen { open: false } leaves the native menu untouched - no preventDefault, no open', () => {
    const core = build({ resolveOpen: () => ({ open: false }) });
    const event = mouse();
    core.handleContextMenu(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(popover.show).not.toHaveBeenCalled();
  });

  it('resolveOpen { open: true, context } commits the context before opening', () => {
    const commitContext = vi.fn();
    const datum = { row: 3 };
    const core = build({ resolveOpen: () => ({ open: true, context: datum }), commitContext });
    const event = mouse();
    core.handleContextMenu(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(commitContext).toHaveBeenCalledWith(datum);
    expect(popover.show).toHaveBeenCalledOnce();
  });

  it('Shift+F10 opens at the host centre without consulting resolveOpen', () => {
    const resolveOpen = vi.fn(() => ({ open: true, context: undefined }) as const);
    const core = build({ resolveOpen });
    const event = {
      key: 'F10',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    core.handleKeydown(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(popover.show).toHaveBeenCalledOnce();
    expect(resolveOpen).not.toHaveBeenCalled();
  });

  it('a non-Shift F10 keydown is ignored', () => {
    const core = build();
    const event = {
      key: 'F10',
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    core.handleKeydown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(popover.show).not.toHaveBeenCalled();
  });
});
