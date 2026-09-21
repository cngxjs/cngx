import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStepperDisplayMode, injectStepperCollapse } from './display-mode';
import type { CngxStepperMobileCollapse } from './stepper-config';

function setup(collapse?: CngxStepperMobileCollapse) {
  const collapsed = signal(false);
  const policy = signal<CngxStepperMobileCollapse | undefined>(collapse);
  return {
    collapsed,
    policy,
    mode: createStepperDisplayMode(collapsed, () => policy()),
  };
}

describe('createStepperDisplayMode', () => {
  it('keeps the classic strip while the container is wide', () => {
    const { mode } = setup('dots');
    expect(mode()).toBe('classic');
  });

  it("collapses to 'text' when no policy is configured", () => {
    const { collapsed, mode } = setup();
    collapsed.set(true);
    expect(mode()).toBe('text');
  });

  it("collapses to 'dots' when the policy asks for it", () => {
    const { collapsed, mode } = setup('dots');
    collapsed.set(true);
    expect(mode()).toBe('dots');
  });

  it("stays classic at any width when the policy is 'off'", () => {
    const { collapsed, mode } = setup('off');
    collapsed.set(true);
    expect(mode()).toBe('classic');
  });

  it('follows the collapse signal in both directions', () => {
    const { collapsed, mode } = setup('text');
    collapsed.set(true);
    expect(mode()).toBe('text');
    collapsed.set(false);
    expect(mode()).toBe('classic');
  });

  it('re-resolves when the policy changes under a collapsed container', () => {
    const { collapsed, policy, mode } = setup('text');
    collapsed.set(true);
    policy.set('dots');
    expect(mode()).toBe('dots');
  });
});

describe('injectStepperCollapse', () => {
  let roMock: ResizeObserverMock;

  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** jsdom resolves no custom properties; stub the pseudo-element read. */
  function stubCollapse(value: string): void {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      (_el: Element, pseudo?: string | null) =>
        ({
          getPropertyValue: (name: string) =>
            pseudo === '::after' && name === '--cngx-stepper-collapse' ? value : '',
        }) as unknown as CSSStyleDeclaration,
    );
  }

  function mount(value: string) {
    const host = document.createElement('cngx-stepper');
    stubCollapse(value);
    const injector = TestBed.inject(Injector);
    return {
      host,
      collapsed: runInInjectionContext(injector, () => injectStepperCollapse(host)),
    };
  }

  it('is false before the first observation, whatever the property says', () => {
    // The container reads the empty string until the observer reports a size,
    // so a stepper never flashes collapsed on mount.
    const { collapsed } = mount('1');
    expect(collapsed()).toBe(false);
  });

  it("reads '1' off the host's ::after as collapsed", () => {
    const { collapsed } = mount('1');
    roMock.triggerResize({
      borderBoxSize: [{ inlineSize: 320, blockSize: 40 }],
    } as unknown as ResizeObserverEntry);
    expect(collapsed()).toBe(true);
  });

  it("reads '0' as not collapsed", () => {
    const { collapsed } = mount('0');
    roMock.triggerResize({
      borderBoxSize: [{ inlineSize: 900, blockSize: 40 }],
    } as unknown as ResizeObserverEntry);
    expect(collapsed()).toBe(false);
  });

  it('observes the host element itself, never an ancestor container', () => {
    // The stepper IS its own container; resolving an ancestor would read the
    // wrong width and silently collapse on the parent's breakpoint.
    const { host } = mount('0');
    expect(roMock.observe).toHaveBeenCalledWith(host, { box: 'border-box' });
  });

  it('needs an injection context - the prefix is the contract', () => {
    const host = document.createElement('cngx-stepper');
    expect(() => injectStepperCollapse(host)).toThrow();
  });
});
