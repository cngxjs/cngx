import { Component, EnvironmentInjector, runInInjectionContext, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMatchMediaMock, type MatchMediaMock } from '@cngx/testing';
import { injectMediaQuery } from './inject-media-query';

const QUERY = '(max-width: 640px)';

@Component({ template: '' })
class Host {
  readonly compact: Signal<boolean> = injectMediaQuery(QUERY);
}

describe('injectMediaQuery', () => {
  let mmMock: MatchMediaMock | undefined;

  beforeEach(() => {
    mmMock = undefined;
    TestBed.configureTestingModule({ imports: [Host] });
  });

  // Per-test restore so the SSR test below sees an absent matchMedia even
  // though earlier tests in this file installed the stub.
  afterEach(() => {
    mmMock?.restore(window);
  });

  function setup(matches = false) {
    mmMock = createMatchMediaMock(matches);
    mmMock.install(window);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance };
  }

  it('seeds the signal from the initial matches value', () => {
    const { host } = setup(true);
    expect(host.compact()).toBe(true);
  });

  it('reflects false when the query does not initially match', () => {
    const { host } = setup();
    expect(host.compact()).toBe(false);
  });

  it('updates the signal when the change listener fires', () => {
    const { host } = setup();
    expect(host.compact()).toBe(false);
    mmMock!.trigger(true);
    expect(host.compact()).toBe(true);
  });

  it('removes the change listener on DestroyRef teardown', () => {
    const { fixture, host } = setup();
    fixture.destroy();
    mmMock!.trigger(true);
    expect(host.compact()).toBe(false);
  });

  it('returns a static false signal without throwing when matchMedia is absent (SSR)', () => {
    const injector = TestBed.inject(EnvironmentInjector);

    let result: Signal<boolean> | undefined;
    expect(() => {
      result = runInInjectionContext(injector, () => injectMediaQuery(QUERY));
    }).not.toThrow();
    expect(result!()).toBe(false);
  });
});
