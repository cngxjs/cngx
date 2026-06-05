import {
  Component,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_STEPPER_I18N,
  withStepperI18nLabels,
  type CngxStepperI18nFeature,
} from './i18n/stepper-i18n';
import {
  provideCngxStepper,
  provideCngxStepperAt,
  type CngxStepperFeature,
} from './provide-cngx-stepper';
import {
  CNGX_STEPPER_CONFIG,
  injectStepperConfig,
  withStepperDefaultOrientation,
  withStepperAriaLabels,
  withStepperLinear,
  type CngxStepperConfig,
  type CngxStepperConfigFeature,
} from './stepper-config';

describe('provideCngxStepper', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('dispatches config and i18n features to their respective tokens in one call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxStepper(
          withStepperDefaultOrientation('vertical'),
          withStepperLinear(true),
          withStepperAriaLabels({ stepperRegion: 'Schrittfolge' }),
          withStepperI18nLabels({
            stepperLabel: 'Schrittfolge',
            previousStep: 'Vorheriger',
          }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    expect(cfg.defaultOrientation).toBe('vertical');
    expect(cfg.defaultLinear).toBe(true);
    expect(cfg.ariaLabels?.stepperRegion).toBe('Schrittfolge');
    expect(i18n.stepperLabel).toBe('Schrittfolge');
    expect(i18n.previousStep).toBe('Vorheriger');
  });

  it('falls back to library defaults when no features are passed', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideCngxStepper()],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(cfg.defaultLinear).toBe(false);
    expect(i18n.stepperLabel).toBe('Stepper');
  });

  it('only-config features leave i18n at library defaults (no spurious i18n provider)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxStepper(withStepperDefaultOrientation('vertical')),
      ],
    });
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    expect(i18n.stepperLabel).toBe('Stepper');
    expect(i18n.previousStep).toBe('Previous step');
  });

  it('only-i18n features leave config at library defaults', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxStepper(withStepperI18nLabels({ stepperLabel: 'Schritte' })),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    const i18n = TestBed.inject(CNGX_STEPPER_I18N);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(i18n.stepperLabel).toBe('Schritte');
  });

  it('injectStepperConfig sees the aggregator-provided config in an injection context', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxStepper(withStepperLinear(true)),
      ],
    });
    const injector = TestBed.inject(EnvironmentInjector);
    const cfg = runInInjectionContext(injector, () => injectStepperConfig());
    expect(cfg.defaultLinear).toBe(true);
  });

  describe('unbranded-feature rejection', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('drops an unbranded feature instead of routing it to the config bucket', () => {
      // Stale-style mutator: pre-`defineStepperConfigFeature`, no
      // `_target`. Without rejection, this would silently mutate config
      // and any i18n-shaped override carried in the function body would
      // land in the wrong token (Pillar 3 silent-mutation hazard).
      const stale = ((cfg: CngxStepperConfig) => ({
        ...cfg,
        defaultOrientation: 'vertical' as const,
      })) as CngxStepperConfigFeature;
      // Erase the discriminator (defineStepperConfigFeature would have
      // set it; the test simulates a hand-rolled feature that skipped
      // the helper).
      delete (stale as { _target?: 'config' })._target;

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideCngxStepper(stale satisfies CngxStepperFeature),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      // Stale feature was dropped - config stays at the library default.
      expect(cfg.defaultOrientation).toBe('horizontal');
      // Dev-mode warning surfaced.
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('without a `_target` discriminator'),
      );
    });

    it('still routes branded siblings correctly when an unbranded feature is mixed in', () => {
      const stale = ((i18n) => ({ ...i18n })) as CngxStepperI18nFeature;
      delete (stale as { _target?: 'i18n' })._target;

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideCngxStepper(
            stale satisfies CngxStepperFeature,
            withStepperDefaultOrientation('vertical'),
            withStepperI18nLabels({ stepperLabel: 'Schrittfolge' }),
          ),
        ],
      });
      const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
      const i18n = TestBed.inject(CNGX_STEPPER_I18N);
      expect(cfg.defaultOrientation).toBe('vertical');
      expect(i18n.stepperLabel).toBe('Schrittfolge');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('provideCngxStepperAt', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('component-scoped aggregator dispatches both surfaces (config + i18n)', () => {
    @Component({
      standalone: true,
      template: '',
      viewProviders: [
        ...provideCngxStepperAt(
          withStepperDefaultOrientation('vertical'),
          withStepperI18nLabels({ stepperLabel: 'Schrittfolge' }),
        ),
      ],
    })
    class ScopedHost {}

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();
    const scopedCfg = fixture.debugElement.injector.get(CNGX_STEPPER_CONFIG);
    const scopedI18n = fixture.debugElement.injector.get(CNGX_STEPPER_I18N);
    expect(scopedCfg.defaultOrientation).toBe('vertical');
    expect(scopedI18n.stepperLabel).toBe('Schrittfolge');
  });
});
