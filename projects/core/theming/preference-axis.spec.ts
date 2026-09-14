import { Component, InjectionToken, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
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
  removeValue: 'auto',
});

const CNGX_PROBE_SET_AXIS = new InjectionToken<WritableSignal<'a' | 'b'>>('CNGX_PROBE_SET_AXIS', {
  providedIn: 'root',
  factory: () => signal<'a' | 'b'>('a'),
});

const setAxis = createPreferenceAxis({
  token: CNGX_PROBE_SET_AXIS,
  attribute: 'data-probe-set',
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
