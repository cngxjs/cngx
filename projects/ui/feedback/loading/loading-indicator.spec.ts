import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { CngxLoadingIndicator, type LoadingIndicatorVariant } from './loading-indicator';

@Component({
  template: `<cngx-loading-indicator
    [loading]="loading()"
    [variant]="variant()"
    [delay]="delay()"
    [minDuration]="minDuration()"
    [label]="label()"
  />`,
  imports: [CngxLoadingIndicator],
})
class TestHost {
  readonly loading = signal(false);
  readonly variant = signal<LoadingIndicatorVariant>('spinner');
  readonly delay = signal(200);
  readonly minDuration = signal(500);
  readonly label = signal('Loading');
}

@Component({
  template: `<cngx-loading-indicator [loading]="loading()" [delay]="0" [minDwell]="250" />`,
  imports: [CngxLoadingIndicator],
})
class MinDwellHost {
  readonly loading = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.componentInstance;
  const el = fixture.nativeElement.querySelector('cngx-loading-indicator') as HTMLElement;
  return { fixture, host, el };
}

describe('CngxLoadingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have role="status"', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('status');
  });

  it('should not render spinner content when not loading', () => {
    const { el } = setup();
    expect(el.querySelector('svg')).toBeNull();
    expect(el.querySelector('.cngx-loading-indicator__bar')).toBeNull();
  });

  it('should render spinner variant by default when visible', () => {
    const { fixture, host, el } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(el.classList.contains('cngx-loading-indicator--spinner')).toBe(true);
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('should render bar variant when variant="bar"', () => {
    const { fixture, host, el } = setup();
    host.variant.set('bar');
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(el.classList.contains('cngx-loading-indicator--bar')).toBe(true);
    expect(el.querySelector('.cngx-loading-indicator__bar')).not.toBeNull();
  });

  it('should apply aria-busy when loading is active', () => {
    const { fixture, host, el } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('should not have aria-busy when not loading', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-busy')).toBeNull();
  });

  it('should set aria-label when visible', () => {
    const { fixture, host, el } = setup();
    host.label.set('Fetching data');
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(el.getAttribute('aria-label')).toBe('Fetching data');
  });

  it('should not have aria-label when not visible', () => {
    const { el } = setup();
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('should respect delay — not visible before delay elapses', () => {
    const { fixture, host, el } = setup();
    host.delay.set(300);
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(false);
    expect(el.querySelector('svg')).toBeNull();
  });

  it('should respect minDuration — stays visible after loading stops', () => {
    const { fixture, host, el } = setup();
    host.delay.set(100);
    host.minDuration.set(400);
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);

    // Stop loading — should stay visible for minDuration
    host.loading.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);

    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(false);
  });

  it('should add visible class only after delay', () => {
    const { fixture, host, el } = setup();
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(false);

    vi.advanceTimersByTime(200);
    fixture.detectChanges();

    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);
  });

  it('deprecated [minDuration] alias still drives the min-dwell hold', () => {
    // The host binds [minDuration]; the input is deprecated in favour of [minDwell]
    // but must keep working for one release. delay 0 -> visible on next tick,
    // then held for the aliased dwell after loading stops.
    const { fixture, host, el } = setup();
    host.delay.set(0);
    host.minDuration.set(300);
    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);

    host.loading.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();

    // Still held before the aliased dwell elapses
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);

    // Released after 300ms
    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(false);
  });

  it('[minDwell] input drives the hold when [minDuration] is unset', () => {
    const fixture = TestBed.createComponent(MinDwellHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement.querySelector('cngx-loading-indicator') as HTMLElement;
    const host = fixture.componentInstance;

    host.loading.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);

    host.loading.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    vi.advanceTimersByTime(150);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(true);

    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-loading-indicator--visible')).toBe(false);
  });
});
