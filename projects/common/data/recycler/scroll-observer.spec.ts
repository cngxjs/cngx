import { Component, DestroyRef, inject, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { createScrollObserver, type ScrollState } from './scroll-observer';

function sizedDiv(className: string, clientHeight: number): HTMLDivElement {
  const el = document.createElement('div');
  el.classList.add(className);
  Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, writable: true, configurable: true });
  return el;
}

// Lets jsdom deliver queued MutationObserver records (a microtask) before the
// assertion runs; a macrotask hop drains the microtask queue first.
const flushMutations = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

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
    Object.defineProperty(mockContainer, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockContainer, 'clientHeight', {
      value: 500,
      writable: true,
      configurable: true,
    });
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

  it('should have null element when selector does not match', () => {
    let state!: ScrollState;

    TestBed.runInInjectionContext(() => {
      const destroyRef = TestBed.inject(DestroyRef);
      state = createScrollObserver('.nonexistent', destroyRef);
    });

    TestBed.flushEffects();

    expect(state.element()).toBeNull();
  });

  it('attaches to a string-selector viewport that mounts after the first render', async () => {
    @Component({ template: '' })
    class Host {
      readonly state = createScrollObserver('.late-mount', inject(DestroyRef));
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects(); // first effect run: selector unresolved
    TestBed.tick(); // afterNextRender: retry bump + late-mount MutationObserver
    TestBed.flushEffects();
    expect(fixture.componentInstance.state.element()).toBeNull();

    const late = sizedDiv('late-mount', 320);
    document.body.appendChild(late);

    await flushMutations(); // observer fires, bumps retryTick
    TestBed.flushEffects(); // retry re-runs the effect, which attaches

    expect(fixture.componentInstance.state.element()).toBe(late);
    expect(fixture.componentInstance.state.clientHeight()).toBe(320);

    late.remove();
  });

  it('disconnects the late-mount observer on attach and never re-resolves', async () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');

    @Component({ template: '' })
    class Host {
      readonly state = createScrollObserver('.late-teardown', inject(DestroyRef));
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    TestBed.tick();
    TestBed.flushEffects();
    expect(disconnectSpy).not.toHaveBeenCalled(); // still watching

    const first = sizedDiv('late-teardown', 100);
    document.body.appendChild(first);
    await flushMutations();
    TestBed.flushEffects();

    expect(fixture.componentInstance.state.element()).toBe(first);
    expect(disconnectSpy).toHaveBeenCalled(); // torn down on attach

    // A second matching mount must not re-resolve — the observer is gone.
    const second = sizedDiv('late-teardown', 999);
    document.body.appendChild(second);
    await flushMutations();
    TestBed.flushEffects();
    expect(fixture.componentInstance.state.element()).toBe(first);

    first.remove();
    second.remove();
    disconnectSpy.mockRestore();
  });

  it('disconnects a never-resolved late-mount observer on host destroy', () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');

    @Component({ template: '' })
    class Host {
      readonly state = createScrollObserver('.never-mounts', inject(DestroyRef));
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    TestBed.tick();
    TestBed.flushEffects();
    expect(fixture.componentInstance.state.element()).toBeNull();
    expect(disconnectSpy).not.toHaveBeenCalled();

    fixture.destroy();
    expect(disconnectSpy).toHaveBeenCalled(); // torn down on destroy
    expect(fixture.componentInstance.state.element()).toBeNull();

    disconnectSpy.mockRestore();
  });
});
