import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { CngxAsyncState, AsyncStatus } from '@cngx/core/utils';

import { CngxLoadingOverlay } from './loading-overlay';

// ── Mock async state helper ────────────────────────────────────────────

function createMockAsyncState(
  overrides: {
    isBusy?: boolean;
    isFirstLoad?: boolean;
  } = {},
): CngxAsyncState<unknown> {
  return {
    status: signal<AsyncStatus>('idle'),
    data: signal(undefined),
    error: signal(undefined),
    progress: signal(undefined),
    isLoading: signal(overrides.isBusy ?? false),
    isPending: signal(false),
    isRefreshing: signal(false),
    isBusy: signal(overrides.isBusy ?? false),
    isFirstLoad: signal(overrides.isFirstLoad ?? false),
    isEmpty: signal(true),
    hasData: signal(false),
    isSettled: signal(false),
    lastUpdated: signal(undefined),
  };
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `
    <cngx-loading-overlay [loading]="loading()" [delay]="delay()" [minDuration]="minDuration()">
      <div class="content">Hello</div>
    </cngx-loading-overlay>
  `,
  imports: [CngxLoadingOverlay],
})
class BoolHost {
  readonly loading = signal(false);
  readonly delay = signal(200);
  readonly minDuration = signal(500);
}

@Component({
  template: `
    <cngx-loading-overlay [state]="state()" [firstLoadOnly]="firstLoadOnly()">
      <div class="content">Hello</div>
    </cngx-loading-overlay>
  `,
  imports: [CngxLoadingOverlay],
})
class StateHost {
  readonly state = signal<CngxAsyncState<unknown> | undefined>(undefined);
  readonly firstLoadOnly = signal(false);
}

function setupBool(opts: { delay?: number; minDuration?: number } = {}) {
  const fixture = TestBed.createComponent(BoolHost);
  if (opts.delay != null) fixture.componentInstance.delay.set(opts.delay);
  if (opts.minDuration != null) fixture.componentInstance.minDuration.set(opts.minDuration);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement.querySelector('cngx-loading-overlay') as HTMLElement;
  return { fixture, host, el };
}

function setupState() {
  const fixture = TestBed.createComponent(StateHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement.querySelector('cngx-loading-overlay') as HTMLElement;
  return { fixture, host, el };
}

describe('CngxLoadingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use display:grid on host', () => {
    const { el } = setupBool();
    expect(el.classList.contains('cngx-loading-overlay')).toBe(true);
  });

  it('should set inert on content wrapper when loading', () => {
    const { fixture, host, el } = setupBool();
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
    expect(wrapper.getAttribute('inert')).not.toBeNull();
  });

  it('should not set inert on content wrapper when not loading', () => {
    const { el } = setupBool();
    const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
    expect(wrapper.getAttribute('inert')).toBeNull();
  });

  it('should set aria-busy on content wrapper when loading', () => {
    const { fixture, host, el } = setupBool();
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
    expect(wrapper.getAttribute('aria-busy')).toBe('true');
  });

  it('should not set aria-busy on content wrapper when not loading', () => {
    const { el } = setupBool();
    const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
    expect(wrapper.getAttribute('aria-busy')).toBeNull();
  });

  it('should not render backdrop before delay', () => {
    const { fixture, host, el } = setupBool({ delay: 200 });
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    expect(el.querySelector('.cngx-loading-overlay__backdrop')).toBeNull();
  });

  it('should render backdrop after delay', () => {
    const { fixture, host, el } = setupBool({ delay: 200 });
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(el.querySelector('.cngx-loading-overlay__backdrop')).not.toBeNull();
  });

  it('should render spinner inside backdrop with role="status"', () => {
    const { fixture, host, el } = setupBool({ delay: 100 });
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    const spinnerWrapper = el.querySelector(
      '.cngx-loading-overlay__spinner-wrapper',
    ) as HTMLElement;
    expect(spinnerWrapper).not.toBeNull();
    expect(spinnerWrapper.getAttribute('role')).toBe('status');
  });

  it('spinner wrapper has tabindex for focus management', () => {
    const { fixture, host, el } = setupBool({ delay: 0 });
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    TestBed.flushEffects();

    const spinnerWrapper = el.querySelector(
      '.cngx-loading-overlay__spinner-wrapper',
    ) as HTMLElement;
    expect(spinnerWrapper).not.toBeNull();
    expect(spinnerWrapper.getAttribute('tabindex')).toBe('-1');
  });

  it('should project content inside the wrapper', () => {
    const { el } = setupBool();
    const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
    const content = wrapper.querySelector('.content') as HTMLElement;
    expect(content).not.toBeNull();
    expect(content.textContent).toBe('Hello');
  });

  describe('firstLoadOnly', () => {
    it('should activate when state.isFirstLoad is true', () => {
      const { fixture, host, el } = setupState();
      const mockState = createMockAsyncState({ isBusy: true, isFirstLoad: true });
      host.state.set(mockState);
      host.firstLoadOnly.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
      expect(wrapper.getAttribute('inert')).not.toBeNull();
    });

    it('should not activate when state.isFirstLoad is false but isBusy is true', () => {
      const { fixture, host, el } = setupState();
      const mockState = createMockAsyncState({ isBusy: true, isFirstLoad: false });
      host.state.set(mockState);
      host.firstLoadOnly.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
      expect(wrapper.getAttribute('inert')).toBeNull();
    });

    it('should activate for isBusy when firstLoadOnly is false', () => {
      const { fixture, host, el } = setupState();
      const mockState = createMockAsyncState({ isBusy: true, isFirstLoad: false });
      host.state.set(mockState);
      host.firstLoadOnly.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();

      const wrapper = el.querySelector('.cngx-loading-overlay__content') as HTMLElement;
      expect(wrapper.getAttribute('inert')).not.toBeNull();
    });
  });
});
