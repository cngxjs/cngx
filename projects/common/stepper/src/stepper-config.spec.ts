import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_STEPPER_CONFIG,
  injectStepperConfig,
  provideStepperConfig,
  provideStepperConfigAt,
  withDefaultOrientation,
  withStepperAriaLabels,
  withStepperCommitMode,
  withStepperFallbackLabels,
  withStepperLinear,
  withStepperRouterSync,
} from './stepper-config';

describe('CngxStepperConfig', () => {
  it('library default is horizontal + non-linear + pessimistic + EN region label', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(cfg.defaultOrientation).toBe('horizontal');
    expect(cfg.defaultLinear).toBe(false);
    expect(cfg.defaultCommitMode).toBe('pessimistic');
    expect(cfg.ariaLabels?.stepperRegion).toBe('Stepper');
  });

  it('provideStepperConfig merges with* features in order', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(
          withDefaultOrientation('vertical'),
          withStepperCommitMode('optimistic'),
          withStepperAriaLabels({ stepperRegion: 'Schrittfolge' }),
        ),
      ],
    });
    const cfg = TestBed.inject(CNGX_STEPPER_CONFIG);
    expect(cfg.defaultOrientation).toBe('vertical');
    expect(cfg.defaultCommitMode).toBe('optimistic');
    expect(cfg.ariaLabels?.stepperRegion).toBe('Schrittfolge');
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

  it('every with* config feature carries the _target=config discriminator', () => {
    // Branding axis — guards against accidental loss of the
    // `_target` brand on any config feature, which would let
    // provideCngxStepper silently drop the feature in dev-mode.
    expect(withDefaultOrientation('vertical')._target).toBe('config');
    expect(withStepperLinear(true)._target).toBe('config');
    expect(withStepperCommitMode('optimistic')._target).toBe('config');
    expect(withStepperRouterSync('queryParam', 'phase')._target).toBe('config');
    expect(withStepperAriaLabels({ stepperRegion: 'Schritte' })._target).toBe(
      'config',
    );
    expect(
      withStepperFallbackLabels({ stepRoleDescription: 'Schritt' })._target,
    ).toBe('config');
  });

  it('provideStepperConfigAt scopes via viewProviders, overriding root', () => {
    @Component({
      standalone: true,
      selector: 'scope-cmp',
      template: '',
      viewProviders: [
        ...provideStepperConfigAt(withDefaultOrientation('vertical')),
      ],
    })
    class ScopeCmp {}

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideStepperConfig(withDefaultOrientation('horizontal')),
      ],
    });
    const fixture = TestBed.createComponent(ScopeCmp);
    fixture.detectChanges();
    const scopedCfg = fixture.debugElement.injector.get(CNGX_STEPPER_CONFIG);
    expect(scopedCfg.defaultOrientation).toBe('vertical');
  });
});
