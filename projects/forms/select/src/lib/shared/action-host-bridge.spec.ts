import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  CNGX_ACTION_SELECT_CONFIG,
  type CngxActionFocusTrapBehavior,
} from './action-select-config';
import { createActionHostBridge } from './action-host-bridge';

function makeBridge(
  options: Parameters<typeof createActionHostBridge>[0],
  providers: unknown[] = [],
): ReturnType<typeof createActionHostBridge> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.runInInjectionContext(() => createActionHostBridge(options));
}

describe('createActionHostBridge', () => {
  it('toggles the dirty signal via setDirty and resets it via cancel', () => {
    const close = vi.fn();
    const bridge = makeBridge({ close });
    expect(bridge.dirty()).toBe(false);
    expect(bridge.shouldBlockDismiss()).toBe(false);

    bridge.callbacks().setDirty(true);
    expect(bridge.dirty()).toBe(true);
    expect(bridge.shouldBlockDismiss()).toBe(true);

    bridge.callbacks().cancel();
    expect(bridge.dirty()).toBe(false);
    expect(bridge.shouldBlockDismiss()).toBe(false);
  });

  it("resolves shouldTrapFocus from the config — 'always' vs 'never' vs 'dirty'", () => {
    const always = makeBridge(
      { close: () => undefined },
      [{ provide: CNGX_ACTION_SELECT_CONFIG, useValue: { focusTrapBehavior: 'always' as CngxActionFocusTrapBehavior } }],
    );
    expect(always.shouldTrapFocus()).toBe(true);

    const never = makeBridge(
      { close: () => undefined },
      [{ provide: CNGX_ACTION_SELECT_CONFIG, useValue: { focusTrapBehavior: 'never' as CngxActionFocusTrapBehavior } }],
    );
    never.callbacks().setDirty(true);
    expect(never.shouldTrapFocus()).toBe(false);

    const dirty = makeBridge({ close: () => undefined });
    expect(dirty.shouldTrapFocus()).toBe(false); // default behavior 'dirty', dirty=false
    dirty.callbacks().setDirty(true);
    expect(dirty.shouldTrapFocus()).toBe(true);
  });

  it('keeps the callbacks reference stable across dirty flips and churns only when isPending changes', () => {
    const pending = signal(false);
    const bridge = makeBridge({ close: () => undefined, isPending: pending });
    const first = bridge.callbacks();
    bridge.callbacks().setDirty(true);
    const afterDirty = bridge.callbacks();
    // Structural equal on isPending means setDirty doesn't reallocate the bundle.
    expect(afterDirty).toBe(first);

    pending.set(true);
    const afterPending = bridge.callbacks();
    expect(afterPending).not.toBe(first);
    expect(afterPending.isPending).toBe(true);
  });
});
