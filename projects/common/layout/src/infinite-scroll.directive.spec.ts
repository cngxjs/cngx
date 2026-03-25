import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CngxInfiniteScroll } from './infinite-scroll.directive';

// ── IntersectionObserver mock ───────────────────────────────────────────

type IntersectionCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;
let mockCallback: IntersectionCallback | null = null;
let mockDisconnect: ReturnType<typeof vi.fn>;

class MockIntersectionObserver {
  constructor(callback: IntersectionCallback, _options?: IntersectionObserverInit) {
    mockCallback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = mockDisconnect;
  takeRecords = vi.fn(() => []);
}

function triggerIntersection(isIntersecting: boolean): void {
  mockCallback?.([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 } as Partial<IntersectionObserverEntry>]);
}

// ── Test host ───────────────────────────────────────────────────────────

@Component({
  template: `<div cngxInfiniteScroll
    [enabled]="enabled()" [loading]="loading()" [debounceMs]="debounceMs()"
    (loadMore)="onLoadMore()"></div>`,
  imports: [CngxInfiniteScroll],
})
class Host {
  readonly enabled = signal(true);
  readonly loading = signal(false);
  readonly debounceMs = signal(200);
  readonly directive = viewChild.required(CngxInfiniteScroll);
  loadMoreCount = 0;
  onLoadMore(): void {
    this.loadMoreCount++;
  }
}

function setup(overrides: { enabled?: boolean; loading?: boolean; debounceMs?: number } = {}) {
  mockDisconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  if (overrides.enabled != null) {host.enabled.set(overrides.enabled);}
  if (overrides.loading != null) {host.loading.set(overrides.loading);}
  if (overrides.debounceMs != null) {host.debounceMs.set(overrides.debounceMs);}
  fixture.detectChanges();
  TestBed.flushEffects();

  const el = fixture.nativeElement.querySelector('div') as HTMLDivElement;
  const directive = host.directive();
  return { fixture, el, directive, host };
}

afterEach(() => {
  vi.unstubAllGlobals();
  mockCallback = null;
});

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxInfiniteScroll', () => {
  it('should emit loadMore when sentinel intersects', () => {
    const { host } = setup({ debounceMs: 0 });
    triggerIntersection(true);
    expect(host.loadMoreCount).toBe(1);
  });

  it('should NOT emit when sentinel leaves viewport', () => {
    const { host } = setup({ debounceMs: 0 });
    triggerIntersection(false);
    expect(host.loadMoreCount).toBe(0);
  });

  it('should NOT emit when loading is true', () => {
    const { host } = setup({ loading: true, debounceMs: 0 });
    triggerIntersection(true);
    expect(host.loadMoreCount).toBe(0);
  });

  it('should NOT emit when enabled is false', () => {
    const { host } = setup({ enabled: false, debounceMs: 0 });
    triggerIntersection(true);
    // Observer shouldn't even be created when disabled
    expect(mockCallback).toBeNull();
    expect(host.loadMoreCount).toBe(0);
  });

  it('should debounce rapid triggers', () => {
    vi.useFakeTimers();
    const { host } = setup({ debounceMs: 200 });
    triggerIntersection(true);
    triggerIntersection(true);
    triggerIntersection(true);
    expect(host.loadMoreCount).toBe(1);
    vi.useRealTimers();
  });

  it('should allow trigger after debounce period', () => {
    vi.useFakeTimers();
    const { host } = setup({ debounceMs: 200 });
    triggerIntersection(true);
    expect(host.loadMoreCount).toBe(1);
    vi.advanceTimersByTime(201);
    triggerIntersection(true);
    expect(host.loadMoreCount).toBe(2);
    vi.useRealTimers();
  });

  it('should expose isLoading signal', () => {
    const { directive } = setup({ loading: true });
    expect(directive.isLoading()).toBe(true);
  });

  it('should apply CSS class when loading', () => {
    const { el } = setup({ loading: true });
    expect(el.classList.contains('cngx-infinite-scroll--loading')).toBe(true);
  });

  it('should set aria-busy when loading', () => {
    const { el } = setup({ loading: true });
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('should disconnect observer on destroy', () => {
    const { fixture } = setup();
    fixture.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should disconnect when enabled changes to false', () => {
    const { fixture } = setup({ enabled: true });
    mockDisconnect.mockClear();
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
