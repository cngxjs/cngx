import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  CNGX_ACTION_SELECT_CONFIG,
  type CngxActionFocusTrapBehavior,
} from './action-select-config';
import {
  createActionHostBridge,
  type ActionHostBridge,
  type ActionHostBridgeOptions,
} from './action-host-bridge';

function makeBridge(
  options: Parameters<typeof createActionHostBridge>[0],
  providers: unknown[] = [],
): ReturnType<typeof createActionHostBridge> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.runInInjectionContext(() => createActionHostBridge(options));
}

/**
 * Build a bridge inside a real component so the bridge's Escape-
 * intercept listener attaches to a real ElementRef. Returns the bridge
 * + the host element so tests can dispatch events on either the host
 * or a child.
 */
function mountBridge(options: ActionHostBridgeOptions): {
  bridge: ActionHostBridge;
  hostEl: HTMLElement;
} {
  @Component({
    selector: 'bridge-host',
    template: '<input type="text" data-test="inner-input" />',
  })
  class BridgeHost {
    readonly bridge = createActionHostBridge(options);
  }
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [BridgeHost] });
  const fixture = TestBed.createComponent(BridgeHost);
  fixture.detectChanges();
  return {
    bridge: fixture.componentInstance.bridge,
    hostEl: fixture.nativeElement as HTMLElement,
  };
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

  it('intercepts Escape on the host element when dirty and invokes cancel()', () => {
    const cancel = vi.fn();
    const { bridge, hostEl } = mountBridge({ close: () => undefined, cancel });
    bridge.callbacks().setDirty(true);

    // Event from a child (simulates Escape pressed in a deep focus-child,
    // e.g. the trigger's <input> OR an action-slot form field).
    const inner = hostEl.querySelector('[data-test="inner-input"]') as HTMLElement;
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    const stopSpy = vi.spyOn(event, 'stopImmediatePropagation');
    inner.dispatchEvent(event);

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('lets Escape pass through when not dirty', () => {
    const cancel = vi.fn();
    const { hostEl } = mountBridge({ close: () => undefined, cancel });

    const inner = hostEl.querySelector('[data-test="inner-input"]') as HTMLElement;
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    inner.dispatchEvent(event);

    expect(cancel).not.toHaveBeenCalled();
    expect(preventSpy).not.toHaveBeenCalled();
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
