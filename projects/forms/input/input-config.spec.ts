import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { coerceSignal } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';

import {
  CNGX_INPUT_CONFIG,
  injectInputAriaLabels,
  injectInputConfig,
  type InputConfig,
  provideInputConfig,
  provideInputConfigAt,
  withInputAriaLabels,
  withNumericDefaults,
} from './input-config';

function resolveIn(providers: unknown[]): InputConfig {
  TestBed.configureTestingModule({ providers: providers as never[] });
  return TestBed.runInInjectionContext(() => TestBed.inject(CNGX_INPUT_CONFIG));
}

describe('withInputAriaLabels', () => {
  it('leaves ariaLabels undefined when no feature is supplied', () => {
    const config = resolveIn([]);
    expect(config.ariaLabels).toBeUndefined();
  });

  it('populates the overridden key from the feature', () => {
    const config = resolveIn([provideInputConfig(withInputAriaLabels({ clear: 'Leeren' }))]);
    expect(coerceSignal(config.ariaLabels)()?.clear).toBe('Leeren');
  });

  it('leaves unset keys undefined so readers fall back to the input section', () => {
    const config = resolveIn([provideInputConfig(withInputAriaLabels({ clear: 'Leeren' }))]);
    expect(coerceSignal(config.ariaLabels)()?.copySuccess).toBeUndefined();
    const labels = TestBed.runInInjectionContext(() => injectInputAriaLabels());
    expect(labels().copySuccess).toBe('Copied');
  });

  it('merges successive overrides without dropping prior keys', () => {
    const config = resolveIn([
      provideInputConfig(
        withInputAriaLabels({ clear: 'Leeren' }),
        withInputAriaLabels({ copySuccess: 'Kopiert' }),
      ),
    ]);
    expect(coerceSignal(config.ariaLabels)()?.clear).toBe('Leeren');
    expect(coerceSignal(config.ariaLabels)()?.copySuccess).toBe('Kopiert');
  });

  it('follows a Signal override and keeps the earlier keys', () => {
    const lang = signal<'en' | 'de'>('en');
    const config = resolveIn([
      provideInputConfig(
        withInputAriaLabels({ copySuccess: 'Kopiert' }),
        withInputAriaLabels(computed(() => (lang() === 'de' ? { clear: 'Leeren' } : {}))),
      ),
    ]);
    const labels = coerceSignal(config.ariaLabels);
    expect(labels()?.clear).toBeUndefined();
    lang.set('de');
    expect(labels()?.clear).toBe('Leeren');
    expect(labels()?.copySuccess).toBe('Kopiert');
  });

  it('injectInputAriaLabels shares one Signal per config and reads an empty bundle unconfigured', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withInputAriaLabels({ clear: 'Leeren' }))],
    });
    const [a, b] = TestBed.runInInjectionContext(() => [
      injectInputAriaLabels(),
      injectInputAriaLabels(),
    ]);
    expect(a).toBe(b);
    expect(a().clear).toBe('Leeren');
  });

  it('ships English defaults with an otpSlot factory', () => {
    TestBed.configureTestingModule({ providers: [] });
    const labels = TestBed.runInInjectionContext(() => injectInputAriaLabels())();
    expect(labels.clear).toBe('Clear');
    expect(labels.otpGroup).toBe('One-time code');
    expect(labels.otpComplete).toBe('Code complete');
    expect(labels.copySuccess).toBe('Copied');
    expect(labels.copyError).toBe('Copy failed');
    expect(labels.otpSlot(0, 6)).toBe('Digit 1 of 6');
    expect(labels.otpSlot(5, 6)).toBe('Digit 6 of 6');
  });
});

describe('withNumericDefaults', () => {
  it('accepts a Signal locale', () => {
    const locale = signal('en-US');
    const config = resolveIn([provideInputConfig(withNumericDefaults({ locale }))]);
    expect(coerceSignal(config.numericLocale)()).toBe('en-US');
    locale.set('de-DE');
    expect(coerceSignal(config.numericLocale)()).toBe('de-DE');
  });
});

describe('provideInputConfigAt / injectInputConfig', () => {
  it('provideInputConfigAt resolves the same merged config as provideInputConfig', () => {
    const config = resolveIn([provideInputConfigAt(withInputAriaLabels({ clear: 'Leeren' }))]);
    expect(coerceSignal(config.ariaLabels)()?.clear).toBe('Leeren');
  });

  it('injectInputConfig resolves without a provider via the root default factory', () => {
    TestBed.configureTestingModule({ providers: [] });
    const config = TestBed.runInInjectionContext(() => injectInputConfig());
    expect(config).toEqual({});
  });
});
