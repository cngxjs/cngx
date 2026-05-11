import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
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
    <cngx-async-container [state]="state()">
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
}

describe('CngxAsyncContainer', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container: HTMLElement = fixture.nativeElement.querySelector('cngx-async-container');
    const state = fixture.componentInstance.state();
    return { fixture, container, state };
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
    fixture.detectChanges();
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
    fixture.detectChanges();

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
});
