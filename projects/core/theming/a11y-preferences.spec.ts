import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_CONTRAST } from './contrast';
import { CNGX_DENSITY } from './density';
import { CNGX_MOTION } from './motion';
import { CNGX_TEXT_SCALE } from './text-scale';
import {
  injectA11yPreferences,
  provideA11yPreferences,
  withContrast,
  withDensity,
  withMotion,
  withPersistence,
  withTextScale,
} from './a11y-preferences';

// An empty host forces the root environment injector to initialise,
// which runs each axis reflector's environment initializer.
@Component({ template: '' })
class Host {}

const attr = (name: string) => document.documentElement.getAttribute(name);

describe('provideA11yPreferences', () => {
  afterEach(() => {
    for (const name of ['data-density', 'data-text-size', 'data-motion', 'data-contrast']) {
      document.documentElement.removeAttribute(name);
    }
  });

  it('installs all four axes at their defaults when no feature is passed', () => {
    TestBed.configureTestingModule({ providers: [provideA11yPreferences()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(TestBed.inject(CNGX_DENSITY)()).toBe('comfortable');
    expect(TestBed.inject(CNGX_TEXT_SCALE)()).toBe('md');
    expect(TestBed.inject(CNGX_MOTION)()).toBe('auto');
    expect(TestBed.inject(CNGX_CONTRAST)()).toBe('auto');
  });

  it('applies the supplied initial per axis and reflects each onto <html>', () => {
    TestBed.configureTestingModule({
      providers: [
        provideA11yPreferences(
          withDensity('compact'),
          withTextScale('lg'),
          withMotion('reduced'),
          withContrast('more'),
        ),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(TestBed.inject(CNGX_DENSITY)()).toBe('compact');
    expect(TestBed.inject(CNGX_TEXT_SCALE)()).toBe('lg');
    expect(TestBed.inject(CNGX_MOTION)()).toBe('reduced');
    expect(TestBed.inject(CNGX_CONTRAST)()).toBe('more');

    expect(attr('data-density')).toBe('compact');
    expect(attr('data-text-size')).toBe('lg');
    expect(attr('data-motion')).toBe('reduced');
    expect(attr('data-contrast')).toBe('more');
  });

  it('is last-wins on a duplicate axis feature', () => {
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withDensity('compact'), withDensity('spacious'))],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(TestBed.inject(CNGX_DENSITY)()).toBe('spacious');
  });

  it('injectA11yPreferences() returns the writable axis signals wired to the tokens', () => {
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withMotion('full'))],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const prefs = TestBed.runInInjectionContext(() => injectA11yPreferences());

    // Same signal instance the token holds.
    expect(prefs.density).toBe(TestBed.inject(CNGX_DENSITY));
    expect(prefs.textScale).toBe(TestBed.inject(CNGX_TEXT_SCALE));
    expect(prefs.motion).toBe(TestBed.inject(CNGX_MOTION));
    expect(prefs.contrast).toBe(TestBed.inject(CNGX_CONTRAST));

    // Writing through the bundle re-reflects onto <html>.
    prefs.contrast.set('more');
    fixture.detectChanges();
    expect(attr('data-contrast')).toBe('more');
  });
});

describe('provideA11yPreferences + withPersistence', () => {
  const KEY = 'cngx-a11y';

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    for (const name of ['data-density', 'data-text-size', 'data-motion', 'data-contrast']) {
      document.documentElement.removeAttribute(name);
    }
  });

  it('rehydrates a stored value on init and reflects it', () => {
    localStorage.setItem(KEY, JSON.stringify({ motion: 'reduced' }));
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(TestBed.inject(CNGX_MOTION)()).toBe('reduced');
    expect(attr('data-motion')).toBe('reduced');
  });

  it('writes back a runtime set', () => {
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    TestBed.inject(CNGX_DENSITY).set('spacious');
    fixture.detectChanges();

    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ density: 'spacious' });
  });

  it('does not persist an untouched axis (first-run skip)', () => {
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    // No change was made, so no key is ever written.
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('leaves an invalid stored value at the axis default without re-persisting it', () => {
    localStorage.setItem(KEY, JSON.stringify({ density: 'bogus' }));
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    // Fell back to the axis default...
    expect(TestBed.inject(CNGX_DENSITY)()).toBe('comfortable');
    // ...and did not overwrite the garbage key with that default.
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ density: 'bogus' });
  });

  it('flushes exactly one write per changed signal (no loop)', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem');
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const writes = () => setSpy.mock.calls.filter(([key]) => key === KEY).length;
    const before = writes();

    TestBed.inject(CNGX_MOTION).set('reduced');
    fixture.detectChanges();
    expect(writes() - before).toBe(1);

    // Same value again: signal equality short-circuits the effect.
    TestBed.inject(CNGX_MOTION).set('reduced');
    fixture.detectChanges();
    expect(writes() - before).toBe(1);
  });

  it('rehydrates before the first reflect (no default-value flash)', () => {
    localStorage.setItem(KEY, JSON.stringify({ density: 'compact' }));
    const setAttrSpy = vi.spyOn(document.documentElement, 'setAttribute');
    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const densityWrites = setAttrSpy.mock.calls
      .filter(([name]) => name === 'data-density')
      .map(([, value]) => value);

    expect(attr('data-density')).toBe('compact');
    // The reflector never flashed the axis default before the stored value.
    expect(densityWrites).not.toContain('comfortable');
    expect(densityWrites[0]).toBe('compact');
  });

  it('is a no-op when localStorage is unavailable (server)', () => {
    localStorage.setItem(KEY, JSON.stringify({ motion: 'reduced' }));
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue(undefined as unknown as Storage);

    TestBed.configureTestingModule({
      providers: [provideA11yPreferences(withPersistence())],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    // Persistence skipped entirely: motion stayed at its default, not rehydrated.
    expect(TestBed.inject(CNGX_MOTION)()).toBe('auto');
  });
});
