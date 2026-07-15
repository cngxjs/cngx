import { Component, EnvironmentInjector, runInInjectionContext, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { injectMediaQuery } from './inject-media-query';

const QUERY = '(max-width: 640px)';

@Component({ template: '' })
class Host {
  readonly compact: Signal<boolean> = injectMediaQuery(QUERY);
}

describe('injectMediaQuery', () => {
  let changeHandler: ((e: { matches: boolean }) => void) | undefined;
  let removeSpy: ReturnType<typeof vi.fn>;
  let matchState: boolean;

  beforeEach(() => {
    changeHandler = undefined;
    removeSpy = vi.fn();
    matchState = false;

    (globalThis as Record<string, unknown>)['matchMedia'] = vi
      .fn()
      .mockImplementation((query: string) => ({
        get matches() {
          return matchState;
        },
        media: query,
        addEventListener: vi.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
          changeHandler = handler;
        }),
        removeEventListener: removeSpy,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

    TestBed.configureTestingModule({ imports: [Host] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>)['matchMedia'];
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance };
  }

  it('seeds the signal from the initial matches value', () => {
    matchState = true;
    const { host } = setup();
    expect(host.compact()).toBe(true);
  });

  it('reflects false when the query does not initially match', () => {
    const { host } = setup();
    expect(host.compact()).toBe(false);
  });

  it('updates the signal when the change listener fires', () => {
    const { host } = setup();
    expect(host.compact()).toBe(false);
    matchState = true;
    changeHandler!({ matches: true });
    expect(host.compact()).toBe(true);
  });

  it('removes the change listener on DestroyRef teardown', () => {
    const { fixture } = setup();
    expect(removeSpy).not.toHaveBeenCalled();
    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('returns a static false signal without throwing when matchMedia is absent (SSR)', () => {
    delete (globalThis as Record<string, unknown>)['matchMedia'];
    const injector = TestBed.inject(EnvironmentInjector);

    let result: Signal<boolean> | undefined;
    expect(() => {
      result = runInInjectionContext(injector, () => injectMediaQuery(QUERY));
    }).not.toThrow();
    expect(result!()).toBe(false);
  });
});
