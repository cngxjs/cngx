import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_INPUT_CONFIG,
  DEFAULT_INPUT_ARIA_LABELS,
  type InputConfig,
  provideInputConfig,
  withInputAriaLabels,
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
    expect(config.ariaLabels?.clear).toBe('Leeren');
  });

  it('leaves unset keys undefined so directives fall back to DEFAULT_INPUT_ARIA_LABELS', () => {
    const config = resolveIn([provideInputConfig(withInputAriaLabels({ clear: 'Leeren' }))]);
    expect(config.ariaLabels?.copySuccess).toBeUndefined();
    expect(config.ariaLabels?.copySuccess ?? DEFAULT_INPUT_ARIA_LABELS.copySuccess).toBe('Copied');
  });

  it('merges successive overrides without dropping prior keys', () => {
    const config = resolveIn([
      provideInputConfig(
        withInputAriaLabels({ clear: 'Leeren' }),
        withInputAriaLabels({ copySuccess: 'Kopiert' }),
      ),
    ]);
    expect(config.ariaLabels?.clear).toBe('Leeren');
    expect(config.ariaLabels?.copySuccess).toBe('Kopiert');
  });

  it('ships English defaults with an otpSlot factory', () => {
    expect(DEFAULT_INPUT_ARIA_LABELS.clear).toBe('Clear');
    expect(DEFAULT_INPUT_ARIA_LABELS.otpGroup).toBe('One-time code');
    expect(DEFAULT_INPUT_ARIA_LABELS.otpComplete).toBe('Code complete');
    expect(DEFAULT_INPUT_ARIA_LABELS.copySuccess).toBe('Copied');
    expect(DEFAULT_INPUT_ARIA_LABELS.otpSlot(0, 6)).toBe('Digit 1 of 6');
    expect(DEFAULT_INPUT_ARIA_LABELS.otpSlot(5, 6)).toBe('Digit 6 of 6');
  });
});
