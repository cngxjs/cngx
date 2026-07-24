import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createManualState } from '@cngx/common/data';
import type { ManualAsyncState } from '@cngx/common/data';

import {
  CngxAsyncContainer,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl,
  CngxAsyncSkeletonTpl,
} from './async-container';

@Component({
  template: `
    <cngx-async-container [state]="state()" [showDelay]="showDelay()" [minDwell]="minDwell()">
      <ng-template cngxAsyncSkeleton>
        <div class="skeleton">Loading skeleton...</div>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <ul class="content">
          @for (item of data; track item) {
            <li>{{ item }}</li>
          }
        </ul>
      </ng-template>

      <ng-template cngxAsyncEmpty>
        <div class="empty">No results</div>
      </ng-template>

      <ng-template cngxAsyncError let-err>
        <div class="error">{{ err }}</div>
      </ng-template>
    </cngx-async-container>
  `,
  imports: [
    CngxAsyncContainer,
    CngxAsyncSkeletonTpl,
    CngxAsyncContentTpl,
    CngxAsyncEmptyTpl,
    CngxAsyncErrorTpl,
  ],
})
class TestHost {
  readonly state = signal<ManualAsyncState<string[]>>(createManualState<string[]>());
  // 0/0 keeps the gated skeleton/refresh views effectively immediate (one macrotask,
  // flipped via advanceTimersByTime). Flash-suppression tests override these.
  readonly showDelay = signal(0);
  readonly minDwell = signal(0);
}

describe('CngxAsyncContainer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container: HTMLElement = fixture.nativeElement.querySelector('cngx-async-container');
    const state = fixture.componentInstance.state();
    return { fixture, container, state };
  }

  // Fire the 0ms gate timers so the skeleton view / refresh bar reflects the state.
  function openGate(fixture: ReturnType<typeof TestBed.createComponent>): void {
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
  }

  function query(container: HTMLElement, sel: string): HTMLElement | null {
    return container.querySelector(sel);
  }

  // --- Skeleton ---

  it('shows skeleton during first load', () => {
    const { fixture, container, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    TestBed.flushEffects();
    openGate(fixture);
    expect(query(container, '.skeleton')).toBeTruthy();
    expect(query(container, '.content')).toBeNull();
  });

  // --- Content ---

  it('shows content on success with data', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['Alice', 'Bob']);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(query(container, '.content')).toBeTruthy();
    expect(query(container, '.skeleton')).toBeNull();
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Alice');
    expect(items[1].textContent).toContain('Bob');
  });

  // --- Empty ---

  it('shows empty template when data is empty array', () => {
    const { fixture, container, state } = setup();
    state.setSuccess([]);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(query(container, '.empty')).toBeTruthy();
    expect(query(container, '.content')).toBeNull();
  });

  // --- Error ---

  it('shows error template on first-load error', () => {
    const { fixture, container, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    TestBed.flushEffects();

    state.setError('Network failure');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(query(container, '.error')).toBeTruthy();
    expect(query(container, '.error')!.textContent).toContain('Network failure');
    expect(query(container, '.skeleton')).toBeNull();
  });

  it('shows content+error on error after prior success', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['Alice']);
    fixture.detectChanges();
    TestBed.flushEffects();

    state.setError('Refresh failed');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(query(container, '.content')).toBeTruthy();
    expect(query(container, '.error')).toBeTruthy();
  });

  // --- Refresh indicator ---

  it('shows refresh indicator during refreshing', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['Alice']);
    fixture.detectChanges();
    TestBed.flushEffects();

    state.set('refreshing');
    fixture.detectChanges();
    TestBed.flushEffects();
    openGate(fixture);

    expect(container.querySelector('cngx-loading-indicator')).toBeTruthy();
  });

  it('hides refresh indicator when not refreshing', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['Alice']);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(container.querySelector('cngx-loading-indicator')).toBeNull();
  });

  // --- ARIA ---

  it('sets aria-busy during busy states', () => {
    const { fixture, container, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(container.getAttribute('aria-busy')).toBe('true');
  });

  it('removes aria-busy when not busy', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['data']);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(container.getAttribute('aria-busy')).toBeNull();
  });

  it('has role="region" on host', () => {
    const { container } = setup();
    expect(container.getAttribute('role')).toBe('region');
  });

  // --- SR announcements ---

  it('announces "Loading content" on first load', () => {
    const { fixture, container, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const srRegion = container.querySelector('[aria-live="polite"]');
    expect(srRegion?.textContent?.trim()).toBe('Loading content');
  });

  it('announces "Content loaded" on first success', () => {
    const { fixture, container, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    TestBed.flushEffects();

    state.setSuccess(['Alice']);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const srRegion = container.querySelector('[aria-live="polite"]');
    expect(srRegion?.textContent?.trim()).toBe('Content loaded');
  });

  it('announces "Error loading content" on first-load error', () => {
    const { fixture, container, state } = setup();
    state.set('loading');
    fixture.detectChanges();
    TestBed.flushEffects();

    state.setError('fail');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const srRegion = container.querySelector('[aria-live="polite"]');
    expect(srRegion?.textContent?.trim()).toBe('Error loading content');
  });

  it('announces "Refreshing content" during refresh', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['Alice']);
    fixture.detectChanges();
    TestBed.flushEffects();

    state.set('refreshing');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const srRegion = container.querySelector('[aria-live="polite"]');
    expect(srRegion?.textContent?.trim()).toBe('Refreshing content');
  });

  it('announces "Content refreshed" after refresh succeeds', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['Alice']);
    fixture.detectChanges();
    TestBed.flushEffects();

    state.set('refreshing');
    fixture.detectChanges();
    TestBed.flushEffects();

    state.setSuccess(['Alice', 'Bob']);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const srRegion = container.querySelector('[aria-live="polite"]');
    expect(srRegion?.textContent?.trim()).toBe('Content refreshed');
  });

  // --- Content context ---

  it('provides data via $implicit context', () => {
    const { fixture, container, state } = setup();
    state.setSuccess(['X', 'Y', 'Z']);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const items = container.querySelectorAll('li');
    expect(items.length).toBe(3);
    expect(items[2].textContent).toContain('Z');
  });

  // --- None view (idle) ---

  it('shows nothing when idle', () => {
    const { container } = setup();
    expect(query(container, '.skeleton')).toBeNull();
    expect(query(container, '.content')).toBeNull();
    expect(query(container, '.empty')).toBeNull();
    expect(query(container, '.error')).toBeNull();
  });

  // --- Flash suppression (gate) ---

  describe('flash suppression', () => {
    it('never renders the skeleton outlet for a sub-showDelay first load', () => {
      const { fixture, container, state } = setup();
      fixture.componentInstance.showDelay.set(120);
      state.set('loading');
      fixture.detectChanges();
      TestBed.flushEffects();

      // 100ms < 120ms: skeleton stays suppressed, but the region is genuinely busy.
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(query(container, '.skeleton')).toBeNull();
      expect(container.getAttribute('aria-busy')).toBe('true');
    });

    it('never renders the refresh bar for a sub-showDelay refresh', () => {
      const { fixture, container, state } = setup();
      fixture.componentInstance.showDelay.set(120);
      state.setSuccess(['Alice']);
      fixture.detectChanges();
      TestBed.flushEffects();

      state.set('refreshing');
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(container.querySelector('cngx-loading-indicator')).toBeNull();
    });

    it('holds the refresh bar for minDwell after refreshing resolves', () => {
      const { fixture, container, state } = setup();
      fixture.componentInstance.minDwell.set(400);
      state.setSuccess(['Alice']);
      fixture.detectChanges();
      TestBed.flushEffects();

      state.set('refreshing');
      fixture.detectChanges();
      TestBed.flushEffects();
      openGate(fixture);
      expect(container.querySelector('cngx-loading-indicator')).toBeTruthy();

      // Refresh resolves quickly; the bar holds for minDwell rather than flashing out.
      state.setSuccess(['Alice', 'Bob']);
      fixture.detectChanges();
      TestBed.flushEffects();
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(container.querySelector('cngx-loading-indicator')).toBeTruthy();

      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(container.querySelector('cngx-loading-indicator')).toBeNull();
    });
  });
});
