import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CNGX_CONTRAST } from './contrast';
import { CNGX_DENSITY } from './density';
import { CNGX_MOTION } from './motion';
import { CNGX_TEXT_SCALE } from './text-scale';
import {
  injectA11yPreferences,
  provideAccessibilityPreferences,
  withContrast,
  withDensity,
  withMotion,
  withTextScale,
} from './a11y-preferences';

// An empty host forces the root environment injector to initialise,
// which runs each axis reflector's environment initializer.
@Component({ template: '' })
class Host {}

const attr = (name: string) => document.documentElement.getAttribute(name);

describe('provideAccessibilityPreferences', () => {
  afterEach(() => {
    for (const name of ['data-density', 'data-text-size', 'data-motion', 'data-contrast']) {
      document.documentElement.removeAttribute(name);
    }
  });

  it('installs all four axes at their defaults when no feature is passed', () => {
    TestBed.configureTestingModule({ providers: [provideAccessibilityPreferences()] });
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
        provideAccessibilityPreferences(
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
      providers: [provideAccessibilityPreferences(withDensity('compact'), withDensity('spacious'))],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(TestBed.inject(CNGX_DENSITY)()).toBe('spacious');
  });

  it('injectA11yPreferences() returns the writable axis signals wired to the tokens', () => {
    TestBed.configureTestingModule({
      providers: [provideAccessibilityPreferences(withMotion('full'))],
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
