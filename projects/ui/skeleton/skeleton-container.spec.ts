import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CngxSkeletonContainer } from './skeleton-container';
import { CngxSkeletonPlaceholder } from './skeleton-placeholder';

@Component({
  template: `
    <cngx-skeleton
      [loading]="loading()"
      [count]="count()"
      [showDelay]="showDelay()"
      [minDwell]="minDwell()"
    >
      <ng-template cngxSkeletonPlaceholder let-i let-last="last">
        <div class="placeholder" [attr.data-index]="i" [attr.data-last]="last"></div>
      </ng-template>
      <div class="content">Real content</div>
    </cngx-skeleton>
  `,
  imports: [CngxSkeletonContainer, CngxSkeletonPlaceholder],
})
class Host {
  readonly loading = signal(true);
  readonly count = signal(3);
  // 0/0 keeps existing behavioural tests effectively synchronous (one macrotask,
  // flipped via advanceTimersByTime). Flash-suppression tests override these.
  readonly showDelay = signal(0);
  readonly minDwell = signal(0);
}

function setup(overrides: { loading?: boolean; count?: number } = {}) {
  const fixture = TestBed.createComponent(Host);
  if (overrides.loading != null) {
    fixture.componentInstance.loading.set(overrides.loading);
  }
  if (overrides.count != null) {
    fixture.componentInstance.count.set(overrides.count);
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  // Fire the 0ms gate timers so the placeholder reflects the loading input.
  vi.advanceTimersByTime(1);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, el };
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
  vi.advanceTimersByTime(1);
  fixture.detectChanges();
}

describe('CngxSkeletonContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render placeholders when loading', () => {
    const { el } = setup({ loading: true, count: 3 });
    const placeholders = el.querySelectorAll('.placeholder');
    expect(placeholders.length).toBe(3);
    expect(el.querySelector('.content')).toBeNull();
  });

  it('should render content when not loading', () => {
    const { el } = setup({ loading: false });
    expect(el.querySelector('.content')).toBeTruthy();
    expect(el.querySelectorAll('.placeholder').length).toBe(0);
  });

  it('should provide template context with index', () => {
    const { el } = setup({ loading: true, count: 3 });
    const placeholders = el.querySelectorAll('.placeholder');
    expect(placeholders[0].getAttribute('data-index')).toBe('0');
    expect(placeholders[1].getAttribute('data-index')).toBe('1');
    expect(placeholders[2].getAttribute('data-index')).toBe('2');
  });

  it('should provide last flag in context', () => {
    const { el } = setup({ loading: true, count: 3 });
    const placeholders = el.querySelectorAll('.placeholder');
    expect(placeholders[0].getAttribute('data-last')).toBe('false');
    expect(placeholders[2].getAttribute('data-last')).toBe('true');
  });

  it('should toggle between loading and content', () => {
    const { el, fixture } = setup({ loading: true, count: 2 });
    expect(el.querySelectorAll('.placeholder').length).toBe(2);

    fixture.componentInstance.loading.set(false);
    flush(fixture);
    expect(el.querySelectorAll('.placeholder').length).toBe(0);
    expect(el.querySelector('.content')).toBeTruthy();
  });

  it('should apply cngx-skeleton class from hostDirective', () => {
    const { el } = setup({ loading: true });
    const host = el.querySelector('cngx-skeleton');
    expect(host?.classList.contains('cngx-skeleton')).toBe(true);
    expect(host?.classList.contains('cngx-skeleton--loading')).toBe(true);
  });

  it('should set aria-busy from hostDirective', () => {
    const { el } = setup({ loading: true });
    const host = el.querySelector('cngx-skeleton');
    expect(host?.getAttribute('aria-busy')).toBe('true');
  });

  it('should use display: contents', () => {
    const { el } = setup();
    const host = el.querySelector('cngx-skeleton') as HTMLElement;
    expect(host?.style.display).toBe('contents');
  });

  describe('flash suppression', () => {
    it('never renders the placeholder for a sub-showDelay first load', () => {
      const fixture = TestBed.createComponent(Host);
      const host = fixture.componentInstance;
      host.showDelay.set(120);
      host.minDwell.set(400);
      host.loading.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      // 100ms < 120ms showDelay: placeholder stays suppressed, aria-busy stays off.
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('.placeholder').length).toBe(0);
      expect(el.querySelector('cngx-skeleton')?.getAttribute('aria-busy')).toBeNull();

      // load resolves before the threshold: never flashes.
      host.loading.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(400);
      fixture.detectChanges();
      expect(el.querySelectorAll('.placeholder').length).toBe(0);
    });

    it('renders after showDelay and holds for minDwell', () => {
      const fixture = TestBed.createComponent(Host);
      const host = fixture.componentInstance;
      host.showDelay.set(120);
      host.minDwell.set(400);
      host.count.set(2);
      host.loading.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      vi.advanceTimersByTime(120);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('.placeholder').length).toBe(2);
      expect(el.querySelector('cngx-skeleton')?.getAttribute('aria-busy')).toBe('true');

      // loading stops immediately, but the placeholder holds for minDwell.
      host.loading.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(el.querySelectorAll('.placeholder').length).toBe(2);

      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(el.querySelectorAll('.placeholder').length).toBe(0);
    });

    it('aria-busy follows the gated value, not the raw loading input', () => {
      const fixture = TestBed.createComponent(Host);
      const host = fixture.componentInstance;
      host.showDelay.set(120);
      host.loading.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      // raw loading is true, but the gate has not opened: aria-busy must be off.
      vi.advanceTimersByTime(50);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('cngx-skeleton')?.getAttribute('aria-busy')).toBeNull();
    });
  });
});
