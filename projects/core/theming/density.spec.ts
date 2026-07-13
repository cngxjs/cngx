import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_DENSITY, injectDensity, provideDensity } from './density';

// An empty host forces the root environment injector to initialise,
// which runs the provideDensity reflector's environment initializer.
@Component({ template: '' })
class Host {}

const densityAttr = () => document.documentElement.getAttribute('data-density');

describe('provideDensity / injectDensity', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-density');
    vi.restoreAllMocks();
  });

  it('reflects the initial value onto <html data-density> after render', () => {
    TestBed.configureTestingModule({ providers: [provideDensity('compact')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(densityAttr()).toBe('compact');
  });

  it('injectDensity().set(...) re-reflects the attribute reactively', () => {
    TestBed.configureTestingModule({ providers: [provideDensity('comfortable')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(densityAttr()).toBe('comfortable');

    const density = TestBed.runInInjectionContext(() => injectDensity());
    density.set('spacious');
    fixture.detectChanges();
    expect(densityAttr()).toBe('spacious');
  });

  it('is idempotent — setting the same value twice does not re-write (no loop)', () => {
    const spy = vi.spyOn(document.documentElement, 'setAttribute');
    TestBed.configureTestingModule({ providers: [provideDensity('compact')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const density = TestBed.inject(CNGX_DENSITY);
    const densityWrites = () =>
      spy.mock.calls.filter(([attr]) => attr === 'data-density').length;

    const afterInit = densityWrites();
    expect(afterInit).toBeGreaterThanOrEqual(1);

    density.set('compact'); // same value — signal equality short-circuits the effect
    fixture.detectChanges();
    expect(densityWrites()).toBe(afterInit);
  });
});
