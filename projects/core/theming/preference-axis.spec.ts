import {
  Component,
  createEnvironmentInjector,
  EnvironmentInjector,
  InjectionToken,
  signal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_DENSITY, provideDensity } from './density';
import { cngxDevWarn } from '@cngx/utils';

import { createPreferenceAxis } from './preference-axis';

// An empty host forces the root environment injector to initialise,
// which runs the axis reflector's environment initializer.
@Component({ template: '' })
class Host {}

type ProbeValue = 'auto' | 'one' | 'two';

const CNGX_PROBE_AXIS = new InjectionToken<WritableSignal<ProbeValue>>('CNGX_PROBE_AXIS', {
  providedIn: 'root',
  factory: () => signal<ProbeValue>('auto'),
});

const probeAxis = createPreferenceAxis({
  token: CNGX_PROBE_AXIS,
  attribute: 'data-probe',
  warnChildInstall: () => cngxDevWarn('CNGX0007', 'provideProbe() in a child injector'),
  warnUnprovidedWrite: () => cngxDevWarn('CNGX0008', 'provideProbe() is not installed'),
  removeValue: 'auto',
});

const CNGX_PROBE_SET_AXIS = new InjectionToken<WritableSignal<'a' | 'b'>>('CNGX_PROBE_SET_AXIS', {
  providedIn: 'root',
  factory: () => signal<'a' | 'b'>('a'),
});

const setAxis = createPreferenceAxis({
  token: CNGX_PROBE_SET_AXIS,
  attribute: 'data-probe-set',
  warnChildInstall: () => undefined,
  warnUnprovidedWrite: () => undefined,
});

const probeAttr = () => document.documentElement.getAttribute('data-probe');

describe('createPreferenceAxis', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-probe');
    document.documentElement.removeAttribute('data-probe-set');
  });

  it('reflects a provided initial onto the configured attribute after render', () => {
    TestBed.configureTestingModule({ providers: [probeAxis.provide('one')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(probeAttr()).toBe('one');
  });

  it('removes the attribute for the removeValue rung and re-sets on leave', () => {
    TestBed.configureTestingModule({ providers: [probeAxis.provide('one')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(probeAttr()).toBe('one');

    const value = TestBed.inject(CNGX_PROBE_AXIS);
    value.set('auto');
    fixture.detectChanges();
    expect(probeAttr()).toBeNull();

    value.set('two');
    fixture.detectChanges();
    expect(probeAttr()).toBe('two');
  });

  it('an axis without removeValue stamps the attribute for every value', () => {
    TestBed.configureTestingModule({ providers: [setAxis.provide('a')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(document.documentElement.getAttribute('data-probe-set')).toBe('a');

    TestBed.inject(CNGX_PROBE_SET_AXIS).set('b');
    fixture.detectChanges();
    expect(document.documentElement.getAttribute('data-probe-set')).toBe('b');
  });

  it('injectValue() returns the same writable signal the token resolves', () => {
    TestBed.configureTestingModule({ providers: [probeAxis.provide('one')] });
    const viaInject = TestBed.runInInjectionContext(() => probeAxis.injectValue());
    expect(viaInject).toBe(TestBed.inject(CNGX_PROBE_AXIS));
  });
});

describe('createPreferenceAxis root-only contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('data-probe');
    document.documentElement.removeAttribute('data-density');
  });

  it('a child install warns, leaves <html> to the root and shares the root signal', () => {
    TestBed.configureTestingModule({ providers: [probeAxis.provide('one')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const child = createEnvironmentInjector(
      [probeAxis.provide('two')],
      TestBed.inject(EnvironmentInjector),
    );
    TestBed.tick();

    expect(probeAttr()).toBe('one');
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      expect.stringMatching(/^CNGX0007: /),
    ]);
    expect(child.get(CNGX_PROBE_AXIS)).toBe(TestBed.inject(CNGX_PROBE_AXIS));

    TestBed.inject(CNGX_PROBE_AXIS).set('two');
    TestBed.tick();
    expect(probeAttr()).toBe('two');

    child.destroy();
    expect(probeAttr()).toBe('two');
  });

  it('a root install does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.configureTestingModule({ providers: [probeAxis.provide('one')] });
    TestBed.createComponent(Host).detectChanges();
    TestBed.inject(CNGX_PROBE_AXIS).set('two');
    TestBed.tick();
    expect(warn).not.toHaveBeenCalled();
  });

  it('removes the attribute when the root injector is destroyed', () => {
    TestBed.configureTestingModule({ providers: [probeAxis.provide('one')] });
    TestBed.createComponent(Host).detectChanges();
    expect(probeAttr()).toBe('one');

    TestBed.resetTestingModule();
    expect(probeAttr()).toBeNull();
  });

  it('warns when the axis signal is set without its provider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.inject(CNGX_DENSITY).set('compact');
    expect(document.documentElement.getAttribute('data-density')).toBeNull();
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      expect.stringMatching(/^CNGX0008: /),
    ]);
  });

  it('does not warn when the axis signal is set with its provider installed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.configureTestingModule({ providers: [provideDensity()] });
    TestBed.createComponent(Host).detectChanges();
    TestBed.inject(CNGX_DENSITY).set('compact');
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    expect(warn).not.toHaveBeenCalled();
  });
});
