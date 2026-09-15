import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxPopover } from '@cngx/common/popover';

import {
  CNGX_DISMISS_HANDLER_FACTORY,
  createDismissHandler,
  type DismissHandlerOptions,
} from './dismiss-handler';

interface PopoverMock {
  ref: CngxPopover;
  hideCalls: number;
  visible: boolean;
}

function makePopover(visible = true): PopoverMock {
  const mock: PopoverMock = {
    hideCalls: 0,
    visible,
    ref: null as unknown as CngxPopover,
  };
  mock.ref = {
    isVisible: () => mock.visible,
    hide: () => {
      mock.hideCalls++;
    },
  } as unknown as CngxPopover;
  return mock;
}

function make(
  overrides: Partial<DismissHandlerOptions> = {},
  popover: PopoverMock = makePopover(),
): { handler: ReturnType<typeof createDismissHandler>; popover: PopoverMock } {
  const handler = createDismissHandler({
    popoverRef: signal(popover.ref),
    dismissOn: 'both',
    ...overrides,
  });
  return { handler, popover };
}

describe('createDismissHandler', () => {
  it('hides a visible popover on outside click when dismissOn is "outside"', () => {
    const { handler, popover } = make({ dismissOn: 'outside' });
    handler.handleClickOutside();
    expect(popover.hideCalls).toBe(1);
  });

  it('hides on outside click when dismissOn is "both"', () => {
    const { handler, popover } = make({ dismissOn: 'both' });
    handler.handleClickOutside();
    expect(popover.hideCalls).toBe(1);
  });

  it('does not hide on outside click when dismissOn is "escape" only', () => {
    const { handler, popover } = make({ dismissOn: 'escape' });
    handler.handleClickOutside();
    expect(popover.hideCalls).toBe(0);
  });

  it('does not hide when the popover is not visible', () => {
    const { handler, popover } = make({ dismissOn: 'outside' }, makePopover(false));
    handler.handleClickOutside();
    expect(popover.hideCalls).toBe(0);
  });

  it('is a no-op when the popover ref is undefined', () => {
    const handler = createDismissHandler({
      popoverRef: signal<CngxPopover | undefined>(undefined),
      dismissOn: 'both',
    });
    expect(() => handler.handleClickOutside()).not.toThrow();
  });

  it('respects shouldBlockDismiss before the dismissOn check', () => {
    const block = signal(true);
    const { handler, popover } = make({ dismissOn: 'both', shouldBlockDismiss: block });
    handler.handleClickOutside();
    expect(popover.hideCalls).toBe(0);

    // Unblocking lets the next click through - the gate is read per call.
    block.set(false);
    handler.handleClickOutside();
    expect(popover.hideCalls).toBe(1);
  });
});

describe('CNGX_DISMISS_HANDLER_FACTORY', () => {
  it('defaults to createDismissHandler', () => {
    expect(TestBed.inject(CNGX_DISMISS_HANDLER_FACTORY)).toBe(createDismissHandler);
  });
});
