import { computed, signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { CngxActiveDescendant } from '@cngx/common/a11y';

import {
  createContextMenuTriggerCore,
  type CngxContextMenuTriggerPopoverRef,
} from './context-menu-trigger-core';
import type {
  CngxMenuDismissHandlerFactory,
  CngxMenuDismissHandlerOptions,
} from './dismiss-handler';
import { createMenuFocusStack, type CngxMenuFocusStack } from './menu-focus-stack';
import { DEFAULT_MENU_CONFIG } from './menu-config';
import { withAriaLabels, withTryFallbacks } from './menu-config-features';
import type { CngxMenuHost } from './menu-host.token';
import { createW3CMenuStrategy } from './menu-nav-strategy';

function mockPopover(): CngxContextMenuTriggerPopoverRef & {
  show: ReturnType<typeof vi.fn>;
  claimPositionTryFallbacks: Mock<(owner: object, value: readonly string[]) => void>;
  releasePositionTryFallbacks: Mock<(owner: object) => void>;
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
    setAnchorElement: vi.fn(),
    id: () => 'test',
    claimPositionTryFallbacks: vi.fn<(owner: object, value: readonly string[]) => void>(),
    releasePositionTryFallbacks: vi.fn<(owner: object) => void>(),
  };
}

function mockMenu(): CngxMenuHost & { highlightFirst: ReturnType<typeof vi.fn> } {
  const highlightFirst = vi.fn();
  return {
    ad: {
      highlightFirst,
      orientation: signal<'vertical' | 'horizontal'>('vertical'),
    } as unknown as CngxActiveDescendant,
    submenuItems: signal([]),
    focus: vi.fn(),
    id: signal('cngx-menu-mock'),
    contains: () => false,
    registerSubmenuItem: () => () => {},
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
      nav: createW3CMenuStrategy(),
      direction: signal<'ltr' | 'rtl'>('ltr'),
      focusStackFactory: createMenuFocusStack,
      ...over,
    });
  }

  function spyFocusStack() {
    const handleArrowRight = vi.fn();
    const handleArrowLeft = vi.fn();
    const stack = {
      stack: signal<readonly CngxMenuHost[]>([]).asReadonly(),
      effectiveMenu: () => menu,
      activeSubmenu: () => undefined,
      handleEscape: vi.fn(),
      handleArrowRight,
      handleArrowLeft,
      handleActivation: vi.fn(),
      openSubmenuFor: vi.fn(),
      noteSubmenuOpened: vi.fn(),
      closeAll: vi.fn(),
    } as unknown as CngxMenuFocusStack;
    return { stack, handleArrowRight, handleArrowLeft };
  }

  function arrow(k: 'ArrowLeft' | 'ArrowRight'): KeyboardEvent {
    return { key: k, preventDefault: vi.fn() } as unknown as KeyboardEvent;
  }

  it('announces the dismissal in the language current at dismiss time', () => {
    const lang = signal<'en' | 'de'>('en');
    const menuConfig = withAriaLabels(
      computed(() => (lang() === 'de' ? { menuDismissed: 'Menü geschlossen' } : {})),
    )(DEFAULT_MENU_CONFIG);
    let opts: CngxMenuDismissHandlerOptions | undefined;
    const capturingFactory: CngxMenuDismissHandlerFactory = (o) => {
      opts = o;
      return { attach: () => () => {} };
    };
    const announce = vi.fn();
    const core = build({ menuConfig, dismissFactory: capturingFactory, announcer: { announce } });
    core.handleContextMenu(mouse());
    expect(opts).toBeDefined();

    opts!.onDismiss?.('escape');
    lang.set('de');
    opts!.onDismiss?.('escape');
    expect(announce.mock.calls.map((c) => c[0])).toEqual(['Menu dismissed', 'Menü geschlossen']);
  });

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

  it('Shift+F10 routes through resolveKeyboardOpen and commits its context', () => {
    const commitContext = vi.fn();
    const datum = { row: 7 };
    const core = build({
      resolveKeyboardOpen: () => ({ open: true, context: datum }),
      commitContext,
    });
    const event = {
      key: 'F10',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    core.handleKeydown(event);

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(commitContext).toHaveBeenCalledWith(datum);
    expect(popover.show).toHaveBeenCalledOnce();
  });

  it('resolveKeyboardOpen { open: false } vetoes the keyboard open', () => {
    const core = build({ resolveKeyboardOpen: () => ({ open: false }) });
    const event = {
      key: 'F10',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent;
    core.handleKeydown(event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(popover.show).not.toHaveBeenCalled();
  });

  it('standDown detaches, resets the stack, and discards focus without restoring', () => {
    const reset = vi.fn();
    const discardFocus = vi.fn();
    const restoreFocus = vi.fn();
    const captureFocus = vi.fn();
    const stack = {
      stack: signal<readonly CngxMenuHost[]>([]).asReadonly(),
      effectiveMenu: () => menu,
      activeSubmenu: () => undefined,
      captureFocus,
      restoreFocus,
      discardFocus,
      reset,
      handleEscape: vi.fn(),
      handleArrowRight: vi.fn(),
      handleArrowLeft: vi.fn(),
      openSubmenuFor: vi.fn(),
      noteSubmenuOpened: vi.fn(),
    } as unknown as CngxMenuFocusStack;
    const core = build({ focusStackFactory: () => stack });

    core.handleContextMenu(mouse());
    core.standDown();

    expect(reset).toHaveBeenCalled();
    expect(discardFocus).toHaveBeenCalled();
    expect(restoreFocus).not.toHaveBeenCalled();
  });

  function stackSpies() {
    const discardFocus = vi.fn();
    const restoreFocus = vi.fn();
    const settleFocus = vi.fn();
    const stack = {
      stack: signal<readonly CngxMenuHost[]>([]).asReadonly(),
      effectiveMenu: () => menu,
      activeSubmenu: () => undefined,
      captureFocus: vi.fn(),
      restoreFocus,
      discardFocus,
      settleFocus,
      reset: vi.fn(),
      handleEscape: vi.fn(),
      handleArrowRight: vi.fn(),
      handleArrowLeft: vi.fn(),
      openSubmenuFor: vi.fn(),
      noteSubmenuOpened: vi.fn(),
    } as unknown as CngxMenuFocusStack;
    return { stack, settleFocus };
  }

  it('hands a focus-out close to the focus stack to settle', () => {
    let opts: CngxMenuDismissHandlerOptions | undefined;
    const capturingFactory: CngxMenuDismissHandlerFactory = (o) => {
      opts = o;
      return { attach: () => () => {} };
    };
    const { stack, settleFocus } = stackSpies();
    const core = build({ dismissFactory: capturingFactory, focusStackFactory: () => stack });
    core.handleContextMenu(mouse());
    core.syncOpenState(true);
    popover.hide();
    opts?.onDismiss?.('focus-out');
    core.syncOpenState(false);
    expect(settleFocus).toHaveBeenCalledExactlyOnceWith('focus-out');
  });

  it('hands any other close source to the focus stack to settle', () => {
    let opts: CngxMenuDismissHandlerOptions | undefined;
    const capturingFactory: CngxMenuDismissHandlerFactory = (o) => {
      opts = o;
      return { attach: () => () => {} };
    };
    const { stack, settleFocus } = stackSpies();
    const core = build({ dismissFactory: capturingFactory, focusStackFactory: () => stack });
    core.handleContextMenu(mouse());
    core.syncOpenState(true);
    popover.hide();
    opts?.onDismiss?.('outside-click');
    core.syncOpenState(false);
    expect(settleFocus).toHaveBeenCalledExactlyOnceWith('outside-click');
  });

  it('hands the dismiss handler the menu chain and the focus-out toggle', () => {
    let opts: CngxMenuDismissHandlerOptions | undefined;
    const capturingFactory: CngxMenuDismissHandlerFactory = (o) => {
      opts = o;
      return { attach: () => () => {} };
    };
    const inside = document.createElement('li');
    menu = { ...menu, contains: (node: Node | null) => node === inside };
    const core = build({ dismissFactory: capturingFactory });
    core.handleContextMenu(mouse());
    expect(opts?.dismissOnFocusOut).toBe(true);
    expect(opts?.menuChainContains?.(inside)).toBe(true);
    expect(opts?.menuChainContains?.(document.createElement('li'))).toBe(false);
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

  describe('submenu arrow routing under dir', () => {
    it('ltr: physical ArrowRight opens the submenu, physical ArrowLeft pops it', () => {
      const { stack, handleArrowRight, handleArrowLeft } = spyFocusStack();
      const core = build({ direction: signal('ltr'), focusStackFactory: () => stack });
      popover.show();

      core.handleKeydown(arrow('ArrowRight'));
      expect(handleArrowRight).toHaveBeenCalledOnce();
      expect(handleArrowLeft).not.toHaveBeenCalled();

      core.handleKeydown(arrow('ArrowLeft'));
      expect(handleArrowLeft).toHaveBeenCalledOnce();
    });

    it('rtl: physical ArrowLeft opens the submenu, physical ArrowRight pops it', () => {
      const { stack, handleArrowRight, handleArrowLeft } = spyFocusStack();
      const core = build({ direction: signal('rtl'), focusStackFactory: () => stack });
      popover.show();

      core.handleKeydown(arrow('ArrowLeft'));
      expect(handleArrowRight).toHaveBeenCalledOnce();
      expect(handleArrowLeft).not.toHaveBeenCalled();

      core.handleKeydown(arrow('ArrowRight'));
      expect(handleArrowLeft).toHaveBeenCalledOnce();
    });
  });

  it('drops the menu highlight on every popover close event, also an open gesture still waiting for items', () => {
    const listeners = new Set<() => void>();
    const closingPopover = {
      ...mockPopover(),
      closed: {
        subscribe: (cb: () => void) => {
          listeners.add(cb);
          return { unsubscribe: () => listeners.delete(cb) };
        },
      },
    };
    const resetHighlight = vi.fn();
    const menuWithReset = mockMenu();
    (menuWithReset.ad as unknown as { resetHighlight: () => void }).resetHighlight = resetHighlight;
    const core = build({ popover: () => closingPopover, menu: () => menuWithReset });

    core.handleContextMenu(mouse());
    expect(listeners.size).toBe(1);

    closingPopover.hide();
    listeners.forEach((cb) => cb());
    expect(resetHighlight).toHaveBeenCalledOnce();

    core.handleContextMenu(mouse());
    expect(listeners.size).toBe(1);

    core.destroy();
    expect(listeners.size).toBe(0);
  });

  it('claims the configured flip chain before the menu shows and releases it on destroy', () => {
    const order: string[] = [];
    popover.claimPositionTryFallbacks.mockImplementation(() => order.push('claim'));
    popover.show.mockImplementation(() => {
      order.push('show');
      popover.visible.set(true);
    });
    const core = build();

    core.handleContextMenu(mouse());
    expect(popover.claimPositionTryFallbacks).toHaveBeenCalledWith(
      expect.anything(),
      DEFAULT_MENU_CONFIG.tryFallbacks,
    );
    expect(order).toEqual(['claim', 'show']);

    const owner = popover.claimPositionTryFallbacks.mock.calls[0][0];
    core.destroy();
    expect(popover.releasePositionTryFallbacks).toHaveBeenCalledWith(owner);
  });

  it('claims an empty chain when the scope opts out of flipping', () => {
    const core = build({ menuConfig: withTryFallbacks([])(DEFAULT_MENU_CONFIG) });

    core.handleContextMenu(mouse());
    expect(popover.claimPositionTryFallbacks).toHaveBeenCalledWith(expect.anything(), []);
    core.destroy();
  });

  it('moves the claim when the popover reference changes between opens', () => {
    const first = popover;
    const second = mockPopover();
    let current = first;
    const core = build({ popover: () => current });

    core.handleContextMenu(mouse());
    first.hide();
    current = second;
    core.handleContextMenu(mouse());

    const owner = first.claimPositionTryFallbacks.mock.calls[0][0];
    expect(first.releasePositionTryFallbacks).toHaveBeenCalledWith(owner);
    expect(second.claimPositionTryFallbacks).toHaveBeenCalledWith(
      owner,
      DEFAULT_MENU_CONFIG.tryFallbacks,
    );
    core.destroy();
  });

  it('claims again on every open so a shared panel takes the chain of the trigger that opened it', () => {
    const optOut = build({ menuConfig: withTryFallbacks([])(DEFAULT_MENU_CONFIG) });
    const flips = build();

    optOut.handleContextMenu(mouse());
    popover.hide();
    flips.handleContextMenu(mouse());
    popover.hide();
    optOut.handleContextMenu(mouse());

    const calls = popover.claimPositionTryFallbacks.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[2]).toEqual([calls[0][0], []]);
    expect(popover.releasePositionTryFallbacks).not.toHaveBeenCalled();
    optOut.destroy();
    flips.destroy();
  });
});
