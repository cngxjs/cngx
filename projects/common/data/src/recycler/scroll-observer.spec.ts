import { DestroyRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { createScrollObserver, type ScrollState } from './scroll-observer';

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('createScrollObserver', () => {
  let mockContainer: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    mockContainer = document.createElement('div');
    mockContainer.classList.add('test-scroll');
    Object.defineProperty(mockContainer, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(mockContainer, 'clientHeight', { value: 500, writable: true, configurable: true });
    document.body.appendChild(mockContainer);

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    mockContainer.remove();
  });

  it('should resolve element via CSS selector', () => {
    let state!: ScrollState;

    TestBed.runInInjectionContext(() => {
      const destroyRef = TestBed.inject(DestroyRef);
      state = createScrollObserver('.test-scroll', destroyRef);
    });

    TestBed.flushEffects();
    expect(state.element()).toBe(mockContainer);
  });

  it('should read initial scrollTop and clientHeight', () => {
    let state!: ScrollState;

    TestBed.runInInjectionContext(() => {
      const destroyRef = TestBed.inject(DestroyRef);
      state = createScrollObserver(mockContainer, destroyRef);
    });

    TestBed.flushEffects();
    expect(state.scrollTop()).toBe(0);
    expect(state.clientHeight()).toBe(500);
  });

  it('should accept HTMLElement directly', () => {
    let state!: ScrollState;

    TestBed.runInInjectionContext(() => {
      const destroyRef = TestBed.inject(DestroyRef);
      state = createScrollObserver(mockContainer, destroyRef);
    });

    TestBed.flushEffects();
    expect(state.element()).toBe(mockContainer);
  });

  it('should warn in dev mode when element is not found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let state!: ScrollState;

    TestBed.runInInjectionContext(() => {
      const destroyRef = TestBed.inject(DestroyRef);
      state = createScrollObserver('.nonexistent', destroyRef);
    });

    TestBed.flushEffects();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Scroll element not found'),
    );
    expect(state.element()).toBeNull();
  });
});
