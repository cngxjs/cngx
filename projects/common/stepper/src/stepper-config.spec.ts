import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_STEPPER_CONFIG,
  injectStepperConfig,
  provideStepperConfig,
  withDefaultOrientation,
  withStepperAriaLabels,
  withStepperCommitMode,
} from './stepper-config';

describe('CngxStepperConfig', () => {
  it('library default is horizontal + non-linear + pessimistic + EN labels', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(cfg.defaultLinear).toBe(false);
    expect(cfg.defaultCommitMode).toBe('pessimistic');
    expect(cfg.ariaLabels?.previousStep).toBe('Previous step');
  });

  it('provideStepperConfig merges with* features in order', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withDefaultOrientation('vertical'),
          withStepperCommitMode('optimistic'),
          withStepperAriaLabels({ previousStep: 'Vorheriger Schritt' }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(cfg.defaultOrientation).toBe('vertical');
    expect(cfg.defaultCommitMode).toBe('optimistic');
    expect(cfg.ariaLabels?.previousStep).toBe('Vorheriger Schritt');
    // Unset keys keep their defaults.
    expect(cfg.ariaLabels?.nextStep).toBe('Next step');
  });

  it('injectStepperConfig works inside an injection context', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.runInInjectionContext(() => {
      const cfg = injectStepperConfig();
      expect(cfg.defaultOrientation).toBe('horizontal');
    });
  });
});
