import { Component, DestroyRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_DIRECTION, injectDirection, provideDirection, provideDirectionAt } from './direction';

const rootDir = () => document.documentElement.getAttribute('dir');

const flushObserver = async () => {
  // MutationObserver callbacks land on the microtask queue, not the Angular
  // effect queue, so TestBed.flushEffects() would never drive them.
  await Promise.resolve();
  await Promise.resolve();
};

@Component({
  selector: 'test-direction-reader',
  template: '',
})
class DirectionReader {
  readonly direction = injectDirection();
}

@Component({
  selector: 'test-direction-host',
  imports: [DirectionReader],
  // viewProviders scopes the override to this component's OWN view: the
  // reader below is a view child, so it resolves the forced 'rtl'. A
  // content-projected reader would fall outside viewProviders and read 'ltr'.
  viewProviders: [provideDirectionAt('rtl')],
  template: '<test-direction-reader />',
})
class DirectionHost {}

@Component({
  selector: 'test-direction-plain-host',
  imports: [DirectionReader],
  template: '<test-direction-reader />',
})
class PlainDirectionHost {}

describe('injectDirection / CNGX_DIRECTION reader', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    vi.restoreAllMocks();
  });

  it("resolves 'ltr' when documentElement has no dir", () => {
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');
  });

  it("resolves 'rtl' when documentElement.dir = 'rtl' at construction", () => {
    document.documentElement.dir = 'rtl';
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('rtl');
  });

  it('re-signals when the root dir flips to rtl at runtime', async () => {
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');

    document.documentElement.dir = 'rtl';
    await flushObserver();

    expect(direction()).toBe('rtl');
  });

  it("normalises dir=\"auto\" to 'ltr'", () => {
    document.documentElement.dir = 'auto';
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');
  });

  it("provideDirection('rtl') overrides the reported value without touching documentElement.dir", () => {
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('rtl');
    expect(rootDir()).toBeNull();
  });

  it('disconnects the observer exactly once on injector destroy', () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect');
    TestBed.runInInjectionContext(() => injectDirection());
    // A resolved reader owns a live observer; destroying the environment
    // injector must run the DestroyRef teardown that disconnects it.
    TestBed.inject(DestroyRef);
    TestBed.resetTestingModule();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it('installs exactly one observer and reuses the root signal on a second inject', () => {
    // One installed observer => exactly one observe() call. Spying the
    // constructor is unreliable (a newed vitest spy yields a mock instance
    // without observe()), so observe() is the stable single-observer proxy.
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    const first = TestBed.runInInjectionContext(() => injectDirection());
    const second = TestBed.runInInjectionContext(() => injectDirection());
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('seeds once and installs no observer on a non-browser platform', async () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    const direction = TestBed.runInInjectionContext(() => injectDirection());
    expect(direction()).toBe('ltr');
    expect(observeSpy).not.toHaveBeenCalled();

    // No observer => a runtime root flip must NOT re-signal on the server.
    document.documentElement.dir = 'rtl';
    await flushObserver();
    expect(direction()).toBe('ltr');
  });

  it('injectDirection() returns the same signal as CNGX_DIRECTION', () => {
    const viaFn = TestBed.runInInjectionContext(() => injectDirection());
    const viaToken = TestBed.inject(CNGX_DIRECTION);
    expect(viaFn).toBe(viaToken);
  });

  it("provideDirectionAt('rtl') in viewProviders makes a view child report 'rtl' without touching documentElement.dir", () => {
    const fixture = TestBed.createComponent(DirectionHost);
    fixture.detectChanges();

    const reader = fixture.debugElement.query(By.directive(DirectionReader))
      .componentInstance as DirectionReader;
    expect(reader.direction()).toBe('rtl');
    expect(rootDir()).toBeNull();
  });

  it("a sibling host without provideDirectionAt reads the document default 'ltr'", () => {
    const fixture = TestBed.createComponent(PlainDirectionHost);
    fixture.detectChanges();

    const reader = fixture.debugElement.query(By.directive(DirectionReader))
      .componentInstance as DirectionReader;
    expect(reader.direction()).toBe('ltr');
  });
});
