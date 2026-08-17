import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { createContextMenuItemSubmenuFacade } from './context-menu-item-submenu-facade';
import type { CngxContextMenu } from './context-menu.component';

function mockTarget() {
  const visible = signal(false);
  const nativeElement = document.createElement('div');
  const popover = {
    isVisible: () => visible(),
    hide: vi.fn(() => visible.set(false)),
    show: vi.fn(() => visible.set(true)),
    anchorElement: { set: vi.fn() },
    id: () => 'pop-1',
    elementRef: { nativeElement },
  };
  return {
    target: { popover } as unknown as CngxContextMenu<unknown>,
    popover,
    nativeElement,
    visible,
  };
}

describe('createContextMenuItemSubmenuFacade', () => {
  it('delegates isVisible / hide / anchorElement / id / elementRef to the target popover', () => {
    const { target, popover, nativeElement, visible } = mockTarget();
    const facade = createContextMenuItemSubmenuFacade(
      () => target,
      () => {},
    );

    expect(facade.isVisible()).toBe(false);
    visible.set(true);
    expect(facade.isVisible()).toBe(true);

    facade.hide();
    expect(popover.hide).toHaveBeenCalledOnce();

    const anchor = document.createElement('div');
    facade.anchorElement.set(anchor);
    expect(popover.anchorElement.set).toHaveBeenCalledWith(anchor);

    expect(facade.id()).toBe('pop-1');
    expect(facade.elementRef.nativeElement).toBe(nativeElement);
  });

  it('routes show() to the open callback, never the target popover show', () => {
    const { target, popover } = mockTarget();
    const open = vi.fn();
    const facade = createContextMenuItemSubmenuFacade(() => target, open);

    facade.show();

    expect(open).toHaveBeenCalledOnce();
    expect(popover.show).not.toHaveBeenCalled();
  });

  it('is inert while the target is undefined', () => {
    const open = vi.fn();
    const facade = createContextMenuItemSubmenuFacade(() => undefined, open);

    expect(facade.isVisible()).toBe(false);
    expect(facade.id()).toBe('');
    expect(() => facade.hide()).not.toThrow();
    expect(() => facade.anchorElement.set(document.createElement('div'))).not.toThrow();
  });
});
