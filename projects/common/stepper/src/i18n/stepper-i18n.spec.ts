import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_STEPPER_I18N,
  injectStepperI18n,
  provideStepperI18n,
  withStepperI18nLabels,
} from './stepper-i18n';

describe('CngxStepperI18n', () => {
  it('library default is English', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    expect(i18n.stepperLabel).toBe('Stepper');
    expect(i18n.selectedStep('Customer', 1, 3)).toBe('Step 1 of 3: Customer');
    expect(i18n.stepHasErrors(1)).toBe('1 error');
    expect(i18n.stepHasErrors(2)).toBe('2 errors');
  });

  it('withStepperI18nLabels composes partial overrides on top of defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels({
            stepperLabel: 'Schrittfolge',
            selectedStep: (label, position, count) =>
              `Schritt ${position} von ${count}: ${label}`,
          }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    expect(i18n.stepperLabel).toBe('Schrittfolge');
    expect(i18n.selectedStep('Kunde', 1, 3)).toBe('Schritt 1 von 3: Kunde');
    // Unset keys keep their English default.
    expect(i18n.previousStep).toBe('Previous step');
  });

  it('multiple withStepperI18nLabels features compose left-to-right', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperI18n(
          withStepperI18nLabels({ stepperLabel: 'A' }),
          withStepperI18nLabels({ stepperLabel: 'B', previousStep: 'Vor' }),
        ),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    // Second feature wins on overlapping keys.
    expect(i18n.stepperLabel).toBe('B');
    expect(i18n.previousStep).toBe('Vor');
  });

  it('withStepperI18nLabels carries the _target=i18n discriminator', () => {
    // Branding axis — guards against accidental loss of the
    // `_target` brand, which would let provideCngxStepper silently
    // drop the feature in dev-mode.
    expect(withStepperI18nLabels({ stepperLabel: 'X' })._target).toBe('i18n');
  });

  it('injectStepperI18n works inside an injection context', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    TestBed.runInInjectionContext(() => {
      const i18n = injectStepperI18n();
      expect(i18n.stepperLabel).toBe('Stepper');
    });
  });
});
